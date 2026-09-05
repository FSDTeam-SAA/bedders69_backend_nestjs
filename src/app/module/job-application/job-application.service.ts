import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { User, UserDocument } from '../user/entities/user.entity';
import { Job, JobDocument } from '../job/entities/job.entity';
import {
  JobApplication,
  JobApplicationDocument,
  JobApplicationStatus,
} from './entities/job-application.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class JobApplicationService {
  constructor(
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplicationDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async applyToJob(carerUserId: string, jobId: string, coverLetter?: string) {
    const user = await this.userModel.findById(carerUserId).lean();
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.role !== 'carer') {
      throw new HttpException(
        'Only carers can apply to jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status !== 'active') {
      throw new HttpException(
        'Your account must be active to apply to jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    const job = await this.jobModel.findById(jobId).lean();
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (job.status !== 'approved') {
      throw new HttpException(
        'You can only apply to approved jobs',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingApplication = await this.jobApplicationModel.findOne({
      jobId,
      carerUserId,
    });
    if (existingApplication) {
      throw new HttpException(
        'You have already applied to this job',
        HttpStatus.BAD_REQUEST,
      );
    }

    const application = await this.jobApplicationModel.create({
      jobId,
      carerUserId,
      organizationUserId: job.organizationUserId,
      name: user.fullName || user.email,
      role: (user as any).roleTitle || job.title || 'Care Assistant',
      location: (user as any).city || (user as any).location || job.city || 'United Kingdom',
      coverLetter,
      status: 'new',
      appliedAt: new Date(),
    });

    const organization = await this.userModel
      .findById(job.organizationUserId)
      .select('fullName email')
      .lean();

    await this.notificationService.notifyEmail({
      event: 'job_application_created',
      recipientEmail: (organization as any)?.email,
      recipientName: (organization as any)?.fullName,
      recipientUserId: String(job.organizationUserId),
      templateData: {
        jobTitle: job.title,
        applicantName: user.fullName || user.email,
      },
      metadata: {
        jobId,
        applicationId: String((application as any)._id),
        carerUserId,
      },
    });

    return application;
  }

  async getMyApplications(carerUserId: string, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = { carerUserId };

    const [total, applications] = await Promise.all([
      this.jobApplicationModel.countDocuments(whereConditions),
      this.jobApplicationModel
        .find(whereConditions)
        .populate(
          'jobId',
          'title city jobType salaryMin salaryMax salaryCurrency organizationUserId',
        )
        .populate({
          path: 'jobId',
          populate: {
            path: 'organizationUserId',
            select: 'fullName email',
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: applications,
    };
  }

  async getJobApplications(
    jobId: string,
    organizationUserId: string,
    options: IOptions,
  ) {
    const job = await this.jobModel.findById(jobId).lean();
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (String(job.organizationUserId) !== organizationUserId) {
      throw new HttpException(
        'You can only view applications for your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = { jobId };

    const [total, applications] = await Promise.all([
      this.jobApplicationModel.countDocuments(whereConditions),
      this.jobApplicationModel
        .find(whereConditions)
        .populate('carerUserId', 'fullName email phoneNumber')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: applications,
    };
  }

  async getApplicationDetail(
    applicationId: string,
    organizationUserId: string,
  ) {
    const application = await this.jobApplicationModel
      .findById(applicationId)
      .populate('jobId', 'title organizationUserId')
      .populate('carerUserId', 'fullName email phoneNumber')
      .lean();

    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    const job = (application as any).jobId;
    if (job && String(job.organizationUserId) !== organizationUserId) {
      throw new HttpException(
        'You can only view applications for your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    return application;
  }

  async getOrganizationApplicants(
    organizationUserId: string,
    options: IOptions,
  ) {
    // 1. Find all job IDs created by this organization
    const orgJobs = await this.jobModel
      .find({ organizationUserId })
      .select('_id')
      .lean();
    const orgJobIds = orgJobs.map((j) => j._id);

    let orgUserObjId: Types.ObjectId | null = null;
    try {
      if (Types.ObjectId.isValid(organizationUserId)) {
        orgUserObjId = new Types.ObjectId(organizationUserId);
      }
    } catch (e) {}

    const whereConditions: Record<string, unknown> = {
      $or: [
        { organizationUserId: organizationUserId },
        ...(orgUserObjId ? [{ organizationUserId: orgUserObjId }] : []),
        { jobId: { $in: orgJobIds } },
      ],
    };

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const [total, rawApplications] = await Promise.all([
      this.jobApplicationModel.countDocuments(whereConditions),
      this.jobApplicationModel
        .find(whereConditions)
        .populate('carerUserId', 'fullName email phoneNumber city role')
        .populate('jobId', 'title city jobType')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    const formatted = rawApplications.map((item: any) => {
      const carer = item.carerUserId;
      const job = item.jobId;
      const name = item.name || carer?.fullName || carer?.email || 'Applicant';
      const role = item.role || job?.title || 'Care Assistant';
      const location = item.location || carer?.city || job?.city || 'United Kingdom';
      const initials =
        item.initials ||
        (name
          ? name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
          : 'AP');

      return {
        ...item,
        name,
        role,
        location,
        initials,
        applied: item.appliedAt
          ? new Date(item.appliedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent',
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      meta: { page, limit, total, totalPages },
      data: formatted,
    };
  }

  async createOrganizationApplicant(
    organizationUserId: string,
    dto: any,
  ) {
    const initials = dto.name
      ? dto.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'AP';

    const applicant = await this.jobApplicationModel.create({
      ...dto,
      initials: dto.initials || initials,
      organizationUserId,
      status: (dto.status || 'new').toLowerCase(),
    });

    return applicant;
  }

  async updateApplicationStatus(
    applicationId: string,
    organizationUserId: string,
    status: string,
    reason?: string,
  ) {
    const normalizedStatus = status.toLowerCase() as any;

    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    application.status = normalizedStatus;
    if (reason && reason.trim()) {
      application.notes = application.notes
        ? `${application.notes}\nNote: ${reason.trim()}`
        : `Note: ${reason.trim()}`;
    }

    await application.save();
    return application;
  }

  async withdrawApplication(applicationId: string, carerUserId: string) {
    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    if (String(application.carerUserId) !== carerUserId) {
      throw new HttpException(
        'You can only withdraw your own applications',
        HttpStatus.FORBIDDEN,
      );
    }

    if (application.status === 'withdrawn') {
      throw new HttpException(
        'Application is already withdrawn',
        HttpStatus.BAD_REQUEST,
      );
    }

    application.status = 'withdrawn';
    await application.save();

    return {
      applicationId,
      status: application.status,
    };
  }

  async getAdminApplications(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { status } = params;

    const whereConditions: Record<string, unknown> = {};

    if (status) whereConditions.status = status;

    const [total, applications] = await Promise.all([
      this.jobApplicationModel.countDocuments(whereConditions),
      this.jobApplicationModel
        .find(whereConditions)
        .populate('jobId', 'title city')
        .populate('carerUserId', 'fullName email')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: applications,
    };
  }
}

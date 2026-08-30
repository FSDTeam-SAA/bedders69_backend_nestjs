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
      coverLetter,
      status: 'pending',
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
    const count = await this.jobApplicationModel.countDocuments({
      organizationUserId,
    });

    if (count === 0) {
      const initialApplicants = [
        {
          jobId: new Types.ObjectId(),
          carerUserId: new Types.ObjectId(),
          organizationUserId,
          name: 'James Okafor',
          initials: 'JO',
          avatarBg: 'bg-emerald-600',
          experience: '5 years',
          role: 'Senior Care Assistant',
          location: 'Manchester',
          status: 'new',
          matchScore: 87,
          verified: true,
          notes:
            'Strong candidate — excellent dementia experience. Follow up re: availability.',
          documents: [
            { name: 'CV / Resume', size: '245 KB' },
            { name: 'NVQ Certificate', size: '182 KB' },
          ],
        },
        {
          jobId: new Types.ObjectId(),
          carerUserId: new Types.ObjectId(),
          organizationUserId,
          name: 'Emma Williams',
          initials: 'EW',
          avatarBg: 'bg-indigo-600',
          experience: '8 years',
          role: 'Registered Nurse',
          location: 'Salford',
          status: 'shortlisted',
          matchScore: 92,
          verified: true,
          notes:
            'Extensive clinical experience in dementia ward management and medication admin.',
          documents: [
            { name: 'CV / Resume', size: '310 KB' },
            { name: 'Nursing Pin Certificate', size: '215 KB' },
          ],
        },
        {
          jobId: new Types.ObjectId(),
          carerUserId: new Types.ObjectId(),
          organizationUserId,
          name: 'Priya Patel',
          initials: 'PP',
          avatarBg: 'bg-rose-600',
          experience: '3 years',
          role: 'Support Worker',
          location: 'Stockport',
          status: 'interview',
          matchScore: 79,
          verified: true,
          notes: 'Interview scheduled for Tuesday 2:00 PM via video call.',
          documents: [
            { name: 'CV / Resume', size: '198 KB' },
            { name: 'First Aid Certificate', size: '140 KB' },
          ],
        },
        {
          jobId: new Types.ObjectId(),
          carerUserId: new Types.ObjectId(),
          organizationUserId,
          name: 'Michael Thompson',
          initials: 'MT',
          avatarBg: 'bg-blue-600',
          experience: '7 years',
          role: 'Senior Care Assistant',
          location: 'Bolton',
          status: 'new',
          matchScore: 84,
          verified: true,
          notes:
            'Reliable background in residential care and complex physical support.',
          documents: [
            { name: 'CV / Resume', size: '220 KB' },
            { name: 'DBS Enhanced Check', size: '175 KB' },
          ],
        },
        {
          jobId: new Types.ObjectId(),
          carerUserId: new Types.ObjectId(),
          organizationUserId,
          name: 'Lisa Chen',
          initials: 'LC',
          avatarBg: 'bg-teal-600',
          experience: '10 years',
          role: 'Registered Nurse',
          location: 'Wigan',
          status: 'hired',
          matchScore: 95,
          verified: true,
          notes: 'Offer accepted! Induction scheduled for next Monday.',
          documents: [
            { name: 'CV / Resume', size: '280 KB' },
            { name: 'References & Clearances', size: '320 KB' },
          ],
        },
      ];

      await this.jobApplicationModel.insertMany(initialApplicants);
    }

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = { organizationUserId };

    const [total, applications] = await Promise.all([
      this.jobApplicationModel.countDocuments(whereConditions),
      this.jobApplicationModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      meta: { page, limit, total, totalPages },
      data: applications,
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

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { User, UserDocument } from '../user/entities/user.entity';
import { Job, JobDocument } from '../job/entities/job.entity';
import {
  JobApplication,
  JobApplicationDocument,
  JobApplicationStatus,
} from './entities/job-application.entity';

@Injectable()
export class JobApplicationService {
  constructor(
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplicationDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

  async updateApplicationStatus(
    applicationId: string,
    organizationUserId: string,
    status: string,
    reason?: string,
  ) {
    const application = await this.jobApplicationModel.findById(applicationId);
    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    const job = await this.jobModel.findById(application.jobId).lean();
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (String(job.organizationUserId) !== organizationUserId) {
      throw new HttpException(
        'You can only update applications for your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    const allowedStatuses = ['pending', 'shortlisted', 'accepted', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      throw new HttpException(
        `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    application.status = status as JobApplicationStatus;
    await application.save();

    return {
      applicationId,
      status: application.status,
      reason,
    };
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

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { User, UserDocument } from '../user/entities/user.entity';
import {
  Entitlement,
  EntitlementDocument,
} from '../entitlement/entities/entitlement.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Job, JobDocument } from './entities/job.entity';
import { SavedJob, SavedJobDocument } from './entities/saved-job.entity';
import {
  JobAuditLog,
  JobAuditLogDocument,
} from './entities/job-audit-log.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(SavedJob.name)
    private readonly savedJobModel: Model<SavedJobDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(JobAuditLog.name)
    private readonly jobAuditLogModel: Model<JobAuditLogDocument>,
    @InjectModel(Entitlement.name)
    private readonly entitlementModel: Model<EntitlementDocument>,
  ) {}

  async saveJob(carerUserId: string, jobId: string) {
    const job = await this.jobModel.findOne({ _id: jobId, status: 'approved' });
    if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    await this.savedJobModel.updateOne(
      { carerUserId, jobId },
      { $setOnInsert: { carerUserId, jobId } },
      { upsert: true },
    );
    return { jobId, saved: true };
  }

  async getSavedJobs(carerUserId: string) {
    return this.savedJobModel
      .find({ carerUserId })
      .sort({ createdAt: -1 })
      .populate('jobId')
      .lean();
  }

  async removeSavedJob(carerUserId: string, jobId: string) {
    await this.savedJobModel.deleteOne({ carerUserId, jobId });
    return { jobId, saved: false };
  }

  async createJob(organizationUserId: string, dto: CreateJobDto) {
    const user = await this.userModel.findById(organizationUserId).lean();
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const allowedRoles = [
      'care_company',
      'agency',
      'supplier',
      'service_provider',
    ];
    if (!allowedRoles.includes(user.role)) {
      throw new HttpException(
        'Only organizations can post jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status !== 'active') {
      throw new HttpException(
        'Your account must be active to post jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    const job = await this.jobModel.create({
      ...dto,
      organizationUserId,
      status: 'draft',
      isPublished: false,
    });

    return job;
  }

  async updateJob(
    jobId: string,
    organizationUserId: string,
    dto: UpdateJobDto,
  ) {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (String(job.organizationUserId) !== organizationUserId) {
      throw new HttpException(
        'You can only update your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    if (job.status === 'published' || job.status === 'approved') {
      throw new HttpException(
        'Cannot edit a published or approved job. Close it first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.jobModel.findByIdAndUpdate(
      jobId,
      { ...dto },
      { new: true },
    );

    return updated;
  }

  async publishJob(jobId: string, organizationUserId: string) {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (String(job.organizationUserId) !== organizationUserId) {
      throw new HttpException(
        'You can only publish your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    if (job.status === 'published') {
      throw new HttpException(
        'Job is already published',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (job.status === 'closed') {
      throw new HttpException(
        'Cannot publish a closed job',
        HttpStatus.BAD_REQUEST,
      );
    }

    job.status = 'pending_approval';
    job.isPublished = false;
    await job.save();

    return job;
  }

  async closeJob(jobId: string, organizationUserId: string) {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (String(job.organizationUserId) !== organizationUserId) {
      throw new HttpException(
        'You can only close your own jobs',
        HttpStatus.FORBIDDEN,
      );
    }

    if (job.status === 'closed') {
      throw new HttpException('Job is already closed', HttpStatus.BAD_REQUEST);
    }

    job.status = 'closed';
    job.isPublished = false;
    await job.save();

    return job;
  }

  async approveJob(actorUserId: string, jobId: string, reason?: string) {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (job.status === 'closed') {
      throw new HttpException(
        'Closed jobs cannot be approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousStatus = job.status;
    job.status = 'approved';
    job.isPublished = true;
    job.publishedAt = new Date();
    (job as any).rejectionReason = undefined;
    await job.save();

    await this.jobAuditLogModel.create({
      actorUserId,
      jobId,
      action: 'approve-job',
      previousStatus,
      nextStatus: 'approved',
      reason,
    });

    return {
      jobId,
      previousStatus,
      status: job.status,
      action: 'approve-job',
      job,
    };
  }

  async rejectJob(actorUserId: string, jobId: string, reason?: string) {
    const job = await this.jobModel.findById(jobId);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    if (job.status === 'closed') {
      throw new HttpException(
        'Closed jobs cannot be rejected',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousStatus = job.status;
    job.status = 'rejected';
    job.isPublished = false;
    (job as any).rejectionReason = reason || '';
    await job.save();

    await this.jobAuditLogModel.create({
      actorUserId,
      jobId,
      action: 'reject-job',
      previousStatus,
      nextStatus: 'rejected',
      reason: reason || '',
    });

    return {
      jobId,
      previousStatus,
      status: job.status,
      action: 'reject-job',
      rejectionReason: (job as any).rejectionReason,
      reason: (job as any).rejectionReason,
      job,
    };
  }

  async searchJobs(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const {
      search,
      city,
      postCode,
      jobType,
      requiredSkills,
      minExperience,
      salaryMin,
    } = params;

    const whereConditions: Record<string, unknown> = {
      status: 'approved',
      isPublished: true,
    };

    if (search) {
      whereConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }
    if (city) whereConditions.city = { $regex: city, $options: 'i' };
    if (postCode)
      whereConditions.postCode = { $regex: postCode, $options: 'i' };
    if (jobType) whereConditions.jobType = jobType;
    if (requiredSkills && requiredSkills.length > 0) {
      whereConditions.requiredSkills = { $in: requiredSkills };
    }
    if (minExperience) {
      whereConditions.minExperience = minExperience;
    }
    if (salaryMin !== undefined) {
      whereConditions.salaryMin = { $gte: Number(salaryMin) };
    }

    const [total, jobs] = await Promise.all([
      this.jobModel.countDocuments(whereConditions),
      this.jobModel
        .find(whereConditions)
        .populate('organizationUserId', 'fullName email')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: jobs,
    };
  }

  async getJob(jobId: string) {
    const job = await this.jobModel
      .findById(jobId)
      .populate('organizationUserId', 'fullName email')
      .lean();

    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    const j = job as any;
    let rejectionReason = j.rejectionReason || j.reason || null;
    if (!rejectionReason && j.status === 'rejected') {
      const auditLog = await this.jobAuditLogModel
        .findOne({ jobId: j._id, action: 'reject-job' })
        .sort({ createdAt: -1 })
        .lean();
      if (auditLog?.reason) {
        rejectionReason = auditLog.reason;
      }
    }

    return {
      id: j._id,
      title: j.title,
      description: j.description,
      location: j.location,
      city: j.city,
      postCode: j.postCode,
      jobType: j.jobType,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      salaryCurrency: j.salaryCurrency,
      requiredSkills: j.requiredSkills || [],
      requiredExperience: j.requiredExperience,
      requirements: j.requirements || [],
      status: j.status,
      rejectionReason: rejectionReason || null,
      reason: rejectionReason || null,
      rejection_reason: rejectionReason || null,
      publishedAt: j.publishedAt,
      closesAt: j.closesAt,
      createdAt: j.createdAt,
      organization: j.organizationUserId
        ? {
            id: j.organizationUserId._id,
            name: j.organizationUserId.fullName,
            email: j.organizationUserId.email,
          }
        : null,
    };
  }

  async getMyJobs(organizationUserId: string, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = { organizationUserId };

    const [total, jobs] = await Promise.all([
      this.jobModel.countDocuments(whereConditions),
      this.jobModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    const formattedJobs = await Promise.all(
      jobs.map(async (job: any) => {
        let rejectionReason = job.rejectionReason || job.reason || null;
        if (!rejectionReason && job.status === 'rejected') {
          const auditLog = await this.jobAuditLogModel
            .findOne({ jobId: job._id, action: 'reject-job' })
            .sort({ createdAt: -1 })
            .lean();
          if (auditLog?.reason) {
            rejectionReason = auditLog.reason;
          }
        }

        return {
          ...job,
          rejectionReason: rejectionReason || null,
          reason: rejectionReason || null,
          rejection_reason: rejectionReason || null,
        };
      }),
    );

    return {
      meta: { page, limit, total },
      data: formattedJobs,
    };
  }

  async getAdminJobs(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { status, search } = params;

    const whereConditions: Record<string, unknown> = {};

    if (status) whereConditions.status = status;
    if (search) {
      whereConditions.$or = ['title', 'description', 'city'].map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }

    const [total, jobs] = await Promise.all([
      this.jobModel.countDocuments(whereConditions),
      this.jobModel
        .find(whereConditions)
        .populate('organizationUserId', 'fullName email')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    const formattedJobs = await Promise.all(
      jobs.map(async (job: any) => {
        let rejectionReason = job.rejectionReason || job.reason || null;
        if (!rejectionReason && job.status === 'rejected') {
          const auditLog = await this.jobAuditLogModel
            .findOne({ jobId: job._id, action: 'reject-job' })
            .sort({ createdAt: -1 })
            .lean();
          if (auditLog?.reason) {
            rejectionReason = auditLog.reason;
          }
        }

        return {
          ...job,
          rejectionReason: rejectionReason || null,
          reason: rejectionReason || null,
          rejection_reason: rejectionReason || null,
        };
      }),
    );

    return {
      meta: { page, limit, total },
      data: formattedJobs,
    };
  }
}

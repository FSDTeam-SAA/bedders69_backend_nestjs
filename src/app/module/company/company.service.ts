import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import { IOptions } from '../../helpers/pagenation';
import paginationHelper from '../../helpers/pagenation';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { Job, JobDocument } from '../job/entities/job.entity';
import {
  JobApplication,
  JobApplicationDocument,
} from '../job-application/entities/job-application.entity';
import { CreateSavedCarerDto } from './dto/create-saved-carer.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './entities/company.entity';
import {
  ContactRequest,
  ContactRequestDocument,
} from './entities/contact-request.entity';
import { SavedCarer, SavedCarerDocument } from './entities/saved-carer.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(SavedCarer.name)
    private readonly savedCarerModel: Model<SavedCarerDocument>,
    @InjectModel(ContactRequest.name)
    private readonly contactRequestModel: Model<ContactRequestDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(JobApplication.name)
    private readonly jobApplicationModel: Model<JobApplicationDocument>,
  ) {}

  private getCompletion(values: Record<string, unknown>) {
    const requiredFields = [
      'companyName',
      'email',
      'phoneNumber',
      'address',
      'postCode',
    ];
    const completedFields = requiredFields.filter((field) => {
      const value = values[field];
      return typeof value === 'string' ? value.trim() !== '' : Boolean(value);
    }).length;
    const profileCompletionPercentage = Math.round(
      (completedFields / requiredFields.length) * 100,
    );

    return {
      profileCompletionPercentage,
      profileCompletionStatus:
        profileCompletionPercentage === 100 ? 'complete' : 'incomplete',
    };
  }

  async createCompany(
    createCompanyDto: CreateCompanyDto,
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      cvResume?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
  ) {
    const user = await this.userModel.findOne({
      email: createCompanyDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      email: createCompanyDto.email,
      role: 'care_company',
      password: createCompanyDto.password,
      fullName: createCompanyDto.companyName,
      phoneNumber: createCompanyDto.phoneNumber,
      address: createCompanyDto.address,
    });

    const logo = files?.logo?.[0];
    if (logo) {
      const { url } = await fileUpload.uploadToCloudinary(logo);
      createCompanyDto.logo = url;
    }

    const coverPhoto = files?.coverPhoto?.[0];
    if (coverPhoto) {
      const { url } = await fileUpload.uploadToCloudinary(coverPhoto);
      createCompanyDto.coverPhoto = url;
    }

    const cvResume = files?.cvResume?.[0];
    if (cvResume) {
      const { url } = await fileUpload.uploadToCloudinary(cvResume);
      createCompanyDto.cvResume = url;
    }

    if (files?.supportingDocuments?.length) {
      const uploadedDocuments = await Promise.all(
        files.supportingDocuments.map((file) =>
          fileUpload.uploadToCloudinary(file),
        ),
      );
      createCompanyDto.supportingDocuments = uploadedDocuments.map(
        (file) => file.url,
      );
    }

    const result = await this.companyModel.create({
      ...createCompanyDto,
      userId: newUser._id,
      ...this.getCompletion({ ...createCompanyDto }),
    });

    return result;
  }

  async getMyProfile(userId: string) {
    let company = await this.companyModel.findOne({ userId });
    if (!company) {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new HttpException(
          'Care company user not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const baseName = (user.fullName || '').trim() || 'Care Company';
      const existingWithName = await this.companyModel.findOne({
        companyName: baseName,
      });
      const companyName = existingWithName
        ? `${baseName} (${String(user._id).slice(-4)})`
        : baseName;

      company = await this.companyModel.create({
        userId: user._id,
        companyName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        postCode: (user as unknown as { postCode?: string }).postCode || '',
        profileCompletionPercentage: 0,
        profileCompletionStatus: 'incomplete',
        status: 'pending',
      });
    }

    return company;
  }

  async updateMyProfile(
    userId: string,
    updateCompanyDto: UpdateCompanyDto,
    files?: {
      logo?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      cvResume?: Express.Multer.File[];
      supportingDocuments?: Express.Multer.File[];
    },
  ) {
    const currentCompany = await this.getMyProfile(userId);

    const logo = files?.logo?.[0];
    if (logo) {
      const { url } = await fileUpload.uploadToCloudinary(logo);
      updateCompanyDto.logo = url;
    }

    const coverPhoto = files?.coverPhoto?.[0];
    if (coverPhoto) {
      const { url } = await fileUpload.uploadToCloudinary(coverPhoto);
      updateCompanyDto.coverPhoto = url;
    }

    const cvResume = files?.cvResume?.[0];
    if (cvResume) {
      const { url } = await fileUpload.uploadToCloudinary(cvResume);
      updateCompanyDto.cvResume = url;
    }

    if (files?.supportingDocuments?.length) {
      const uploadedDocuments = await Promise.all(
        files.supportingDocuments.map((file) =>
          fileUpload.uploadToCloudinary(file),
        ),
      );
      updateCompanyDto.supportingDocuments = uploadedDocuments.map(
        (file) => file.url,
      );
    }

    const updatedCompany = await this.companyModel.findOneAndUpdate(
      { userId },
      {
        ...updateCompanyDto,
        ...this.getCompletion({
          ...currentCompany.toObject?.(),
          ...updateCompanyDto,
        }),
      },
      { new: true },
    );

    const linkedUserUpdate: Record<string, unknown> = {};
    if (updateCompanyDto.companyName) {
      linkedUserUpdate.fullName = updateCompanyDto.companyName;
    }
    if (updateCompanyDto.phoneNumber) {
      linkedUserUpdate.phoneNumber = updateCompanyDto.phoneNumber;
    }
    if (updateCompanyDto.address) {
      linkedUserUpdate.address = updateCompanyDto.address;
    }

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }

    return updatedCompany;
  }

  async saveCarer(userId: string, dto: CreateSavedCarerDto) {
    const existing = await this.savedCarerModel.findOne({
      userId,
      carerId: dto.carerId,
    });

    if (existing) {
      Object.assign(existing, dto);
      return await existing.save();
    }

    return await this.savedCarerModel.create({
      ...dto,
      userId,
    });
  }

  async getSavedCarers(userId: string) {
    // Clean up any previously auto-seeded dummy saved carers
    await this.savedCarerModel.deleteMany({
      userId,
      name: { $in: ['Matthew Warkentin', 'Sarah Palmer', 'John Smith'] },
      carerId: { $in: ['1', '2', '3'] },
    });

    return await this.savedCarerModel.find({ userId }).sort({ createdAt: -1 });
  }

  async getSavedCarerById(userId: string, carerId: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(carerId);
    const carer = await this.savedCarerModel.findOne({
      userId,
      ...(isObjectId ? { $or: [{ carerId }, { _id: carerId }] } : { carerId }),
    });

    if (!carer) {
      throw new HttpException('Saved carer not found', HttpStatus.NOT_FOUND);
    }

    return carer;
  }

  async removeSavedCarer(userId: string, carerId: string) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(carerId);
    const result = await this.savedCarerModel.findOneAndDelete({
      userId,
      ...(isObjectId ? { $or: [{ carerId }, { _id: carerId }] } : { carerId }),
    });

    if (!result) {
      throw new HttpException('Saved carer not found', HttpStatus.NOT_FOUND);
    }

    return { message: 'Carer removed from saved list' };
  }

  async getContactRequests(
    userId: string,
    options: IOptions,
    statusFilter?: string,
  ) {
    let userObjId: any = null;
    try {
      if (Types.ObjectId.isValid(userId)) {
        userObjId = new Types.ObjectId(userId);
      }
    } catch (e) {}

    const userCondition: Record<string, any> = userObjId
      ? { $or: [{ userId }, { userId: userObjId }] }
      : { userId };

    // Clean up any previously auto-seeded dummy requests for this user
    await this.contactRequestModel.deleteMany({
      ...userCondition,
      name: {
        $in: [
          'Margaret Turner',
          'Dr. Sarah Hammond',
          'Robert Wilson',
          'Arthur Lewis',
        ],
      },
      phone: {
        $in: [
          '07700 900 123',
          '07700 900 456',
          '07700 900 789',
          '07700 900 999',
        ],
      },
    });

    const [countAll, countPending, countAccepted, countRejected] =
      await Promise.all([
        this.contactRequestModel.countDocuments(userCondition),
        this.contactRequestModel.countDocuments({
          ...userCondition,
          status: 'Pending',
        }),
        this.contactRequestModel.countDocuments({
          ...userCondition,
          status: 'Accepted',
        }),
        this.contactRequestModel.countDocuments({
          ...userCondition,
          status: 'Rejected',
        }),
      ]);

    const whereConditions: Record<string, any> = { ...userCondition };
    if (statusFilter && statusFilter !== 'All') {
      whereConditions.status =
        statusFilter.charAt(0).toUpperCase() +
        statusFilter.slice(1).toLowerCase();
    }

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const [total, requests] = await Promise.all([
      this.contactRequestModel.countDocuments(whereConditions),
      this.contactRequestModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      meta: { page, limit, total, totalPages },
      counts: {
        all: countAll,
        pending: countPending,
        accepted: countAccepted,
        rejected: countRejected,
      },
      data: requests,
    };
  }

  async createContactRequest(
    userId: string,
    dto: CreateContactRequestDto,
  ) {
    const recipientUserId = dto.targetUserId || userId;
    if (!recipientUserId) {
      throw new HttpException(
        'Recipient company or target user ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const senderUser = await this.userModel.findById(userId).lean();
    if (!senderUser) {
      throw new HttpException(
        'User profile not found. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const senderName =
      senderUser.fullName ||
      dto.name ||
      senderUser.email?.split('@')[0] ||
      'Inquirer';

    const senderPhone =
      senderUser.phoneNumber ||
      dto.phone ||
      senderUser.email ||
      'N/A';

    const rawRole = senderUser.role || 'family';
    const formattedCategory =
      rawRole.charAt(0).toUpperCase() +
      rawRole.slice(1).replace(/_/g, ' ');

    const initials = senderName
      ? senderName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'CR';

    return await this.contactRequestModel.create({
      userId: recipientUserId,
      name: senderName,
      phone: senderPhone,
      category: dto.category || formattedCategory,
      message:
        dto.message ||
        `Connection request from ${senderName} (${formattedCategory})`,
      initials: dto.initials || initials,
      avatarBg: dto.avatarBg || 'bg-cyan-600',
      time: dto.time || 'Just now',
      status: dto.status || 'Pending',
    });
  }

  async updateContactRequestStatus(
    userId: string,
    id: string,
    status: string,
  ) {
    const normalized =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    let userObjId: any = null;
    try {
      if (Types.ObjectId.isValid(userId)) {
        userObjId = new Types.ObjectId(userId);
      }
    } catch (e) {}

    const userCondition: Record<string, any> = userObjId
      ? { $or: [{ userId }, { userId: userObjId }] }
      : { userId };

    const result = await this.contactRequestModel.findOneAndUpdate(
      { _id: id, ...userCondition },
      { status: normalized },
      { new: true },
    );

    if (!result) {
      throw new HttpException(
        'Contact request not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  async getDashboardOverview(userId: string) {
    const [
      profile,
      activeJobsCount,
      applicantsCount,
      contactRequestsCount,
      recentApplicants,
    ] = await Promise.all([
      this.companyModel.findOne({ userId }).lean(),
      this.jobModel.countDocuments({ organizationUserId: userId }),
      this.jobApplicationModel.countDocuments({ organizationUserId: userId }),
      this.contactRequestModel.countDocuments({ userId }),
      this.jobApplicationModel
        .find({ organizationUserId: userId })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
    ]);

    const formattedRecentApplicants = recentApplicants.map((app: any) => ({
      id: app._id,
      name: app.name || 'Applicant',
      role: app.role || 'Care Assistant',
      time: app.createdAt
        ? new Date(app.createdAt).toLocaleDateString()
        : 'Recent',
    }));

    return {
      company: {
        companyName: profile?.companyName || '',
        tradingName:
          profile?.tradingName || profile?.companyName || '',
        logo: profile?.logo || '',
      },
      metrics: {
        profileViews: (profile as any)?.profileViews || 0,
        activeJobs: activeJobsCount || 0,
        newApplicants: applicantsCount || 0,
        contactRequests: contactRequestsCount || 0,
      },
      recentApplicants: formattedRecentApplicants,
    };
  }
}

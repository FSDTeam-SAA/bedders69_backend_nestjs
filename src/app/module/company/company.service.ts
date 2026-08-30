import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const company = await this.companyModel.findOne({ userId });
    if (!company) {
      throw new HttpException(
        'Care company profile not found',
        HttpStatus.NOT_FOUND,
      );
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
    const count = await this.savedCarerModel.countDocuments({ userId });
    if (count === 0) {
      // Seed default initial saved carers for rich demo experience
      const initial = [
        {
          carerId: '1',
          name: 'Matthew Warkentin',
          rating: 4.9,
          reviews: 67,
          location: 'London, N1',
          bio: 'Compassionate Care Assistant with 5+ years supporting elderly and vulnerable adults.',
          skills: ['Dementia Care', 'Medication Admin'],
          experience: '2 Years',
          verified: 'DBS Verified',
          rate: '$150/hrs',
          available: true,
          image:
            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
          qualifications: [
            'NVQ Level 3 Health & Social Care',
            'First Aid Certificate (2023)',
            'Dementia Care Training',
          ],
          availability:
            'Mon–Fri 7am–6pm · Sat 8am–2pm · Emergency 24/7 · Weekends · Day Shifts · Night Shifts · Live-In',
          serviceArea: 'Manchester, Greater Manchester',
        },
        {
          carerId: '2',
          name: 'Sarah Palmer',
          rating: 4.7,
          reviews: 35,
          location: 'Birmingham, B2',
          bio: 'Dedicated Support Worker with a focus on mental health and well-being.',
          skills: ['Mental Health Support', 'Crisis Intervention'],
          experience: '3 Years',
          verified: 'DBS Verified',
          rate: '$120/hrs',
          available: true,
          image:
            'https://images.unsplash.com/photo-1594824813527-39908cf8b5cf?auto=format&fit=crop&w=800&q=80',
          qualifications: [
            'BSc Psychology',
            'Mental Health First Aid',
            'Crisis Prevention Certificate',
          ],
          availability: 'Mon–Fri 8am–5pm · Weekends · Day Shifts',
          serviceArea: 'Birmingham, West Midlands',
        },
        {
          carerId: '3',
          name: 'John Smith',
          rating: 4.8,
          reviews: 50,
          location: 'Manchester, M1',
          bio: 'Experienced Home Carer specialized in personal care and companionship.',
          skills: ['Personal Care', 'Companionship'],
          experience: '4 Years',
          verified: 'DBS Verified',
          rate: '$140/hrs',
          available: true,
          image:
            'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=800&q=80',
          qualifications: [
            'Care Certificate',
            'Moving & Handling Qualified',
            'Food Hygiene Level 2',
          ],
          availability: 'Flexible · Day & Night Shifts',
          serviceArea: 'Manchester, Greater Manchester',
        },
      ];

      await this.savedCarerModel.insertMany(
        initial.map((item) => ({ ...item, userId })),
      );
    }

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
    const count = await this.contactRequestModel.countDocuments({ userId });
    if (count === 0) {
      const initial = [
        {
          userId,
          name: 'Margaret Turner',
          initials: 'MT',
          avatarBg: 'bg-cyan-600',
          category: 'Family',
          status: 'Pending',
          message:
            "I'm looking for residential care for my 82-year-old mother. Could you advise on availability?",
          time: 'Today 11:30',
          phone: '07700 900 123',
        },
        {
          userId,
          name: 'Dr. Sarah Hammond',
          initials: 'SH',
          avatarBg: 'bg-indigo-600',
          category: 'Healthcare Professional',
          status: 'Pending',
          message:
            "I'd like to discuss a partnership referral arrangement for our patients.",
          time: 'Today 09:15',
          phone: '07700 900 456',
        },
        {
          userId,
          name: 'Robert Wilson',
          initials: 'RW',
          avatarBg: 'bg-teal-600',
          category: 'Family',
          status: 'Accepted',
          message:
            'Seeking respite care services for 2 weeks starting next month for my father.',
          time: 'Yesterday 16:40',
          phone: '07700 900 789',
        },
        {
          userId,
          name: 'Arthur Lewis',
          initials: 'AL',
          avatarBg: 'bg-rose-600',
          category: 'Individual',
          status: 'Rejected',
          message:
            'Inquiring about immediate live-in care outside your primary service area.',
          time: '3 days ago',
          phone: '07700 900 999',
        },
      ];

      await this.contactRequestModel.insertMany(initial);
    }

    const [countAll, countPending, countAccepted, countRejected] =
      await Promise.all([
        this.contactRequestModel.countDocuments({ userId }),
        this.contactRequestModel.countDocuments({
          userId,
          status: 'Pending',
        }),
        this.contactRequestModel.countDocuments({
          userId,
          status: 'Accepted',
        }),
        this.contactRequestModel.countDocuments({
          userId,
          status: 'Rejected',
        }),
      ]);

    const whereConditions: Record<string, any> = { userId };
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

  async createContactRequest(userId: string, dto: CreateContactRequestDto) {
    const initials = dto.name
      ? dto.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'CR';

    return await this.contactRequestModel.create({
      ...dto,
      initials: dto.initials || initials,
      userId,
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
    const result = await this.contactRequestModel.findOneAndUpdate(
      { _id: id, userId },
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
        companyName: profile?.companyName || 'Sunrise Care Services',
        tradingName:
          profile?.tradingName || profile?.companyName || 'Sunrise Care',
        logo: profile?.logo || '/images/logo.png',
      },
      metrics: {
        profileViews: 620,
        activeJobs: activeJobsCount > 0 ? activeJobsCount : 8,
        newApplicants: applicantsCount > 0 ? applicantsCount : 47,
        contactRequests: contactRequestsCount > 0 ? contactRequestsCount : 6,
      },
      recentApplicants:
        formattedRecentApplicants.length > 0
          ? formattedRecentApplicants
          : [
              {
                name: 'James Okafor',
                role: 'Senior Care Assistant',
                time: '10m ago',
              },
              {
                name: 'Emma Williams',
                role: 'Registered Nurse',
                time: '2h ago',
              },
              {
                name: 'Priya Patel',
                role: 'Support Worker',
                time: 'Yesterday',
              },
              {
                name: 'Michael Thompson',
                role: 'Care Manager',
                time: 'Yesterday',
              },
            ],
    };
  }
}

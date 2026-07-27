import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { Care, CareDocument } from '../care/entities/care.entity';
import { Company, CompanyDocument } from '../company/entities/company.entity';
import { Family, FamilyDocument } from '../family/entities/family.entity';
import { Payment, PaymentDocument } from '../payment/entities/payment.entity';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../user/entities/user.entity';
import { AdminProfileActionDto } from './dto/admin-profile-action.dto';
import { CreateOrganizationProfileDto } from './dto/create-organization-profile.dto';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import {
  OrganizationProfile,
  OrganizationProfileDocument,
  OrganizationProfileType,
  ProfileCompletionStatus,
  ProfileStatus,
} from './entities/organization-profile.entity';
import {
  ProfileAuditAction,
  ProfileAuditLog,
  ProfileAuditLogDocument,
} from './entities/profile-audit-log.entity';
import {
  Entitlement,
  EntitlementDocument,
} from '../entitlement/entities/entitlement.entity';
import { Package, PackageDocument } from '../package/entities/package.entity';
import { NotificationService } from '../notification/notification.service';

const PROFILE_ROLE_LABELS: Record<string, string> = {
  agency: 'Recruitment agency',
  supplier: 'Supplier',
  service_provider: 'Service provider',
};

const STATUS_BY_ACTION: Record<ProfileAuditAction, UserStatus> = {
  'approve-profile': 'active',
  'reject-profile': 'rejected',
  'suspend-profile': 'suspended',
  'reactivate-profile': 'active',
};

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(OrganizationProfile.name)
    private readonly organizationProfileModel: Model<OrganizationProfileDocument>,
    @InjectModel(ProfileAuditLog.name)
    private readonly profileAuditLogModel: Model<ProfileAuditLogDocument>,
    @InjectModel(Family.name)
    private readonly familyModel: Model<FamilyDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Care.name)
    private readonly careModel: Model<CareDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Entitlement.name)
    private readonly entitlementModel: Model<EntitlementDocument>,
    @InjectModel(Package.name)
    private readonly packageModel: Model<PackageDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  private normalizeProfileType(profileType: OrganizationProfileType): UserRole {
    return profileType;
  }

  private isOrganizationProfileType(
    role: UserRole | undefined,
  ): role is OrganizationProfileType {
    return (
      role === 'agency' || role === 'supplier' || role === 'service_provider'
    );
  }

  private getCompletion(values: Record<string, unknown>): {
    profileCompletionStatus: ProfileCompletionStatus;
    profileCompletionPercentage: number;
  } {
    const requiredFields = [
      'organizationName',
      'email',
      'phoneNumber',
      'address',
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

  private async syncOrganizationUser(
    userId: string,
    dto: Partial<UpdateOrganizationProfileDto>,
  ) {
    const linkedUserUpdate: Record<string, unknown> = {};
    if (dto.organizationName) linkedUserUpdate.fullName = dto.organizationName;
    if (dto.phoneNumber) linkedUserUpdate.phoneNumber = dto.phoneNumber;
    if (dto.address) linkedUserUpdate.address = dto.address;
    if (dto.city) linkedUserUpdate.city = dto.city;

    if (Object.keys(linkedUserUpdate).length) {
      await this.userModel.findByIdAndUpdate(userId, linkedUserUpdate);
    }
  }

  private async findOrganizationProfile(
    userId: string,
    role: OrganizationProfileType,
  ) {
    const profile = await this.organizationProfileModel.findOne({
      userId,
      profileType: role,
    });

    if (!profile) {
      throw new HttpException(
        `${PROFILE_ROLE_LABELS[role] || 'Organization'} profile not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return profile;
  }

  async createOrganizationProfile(
    expectedProfileType: OrganizationProfileType,
    createProfileDto: CreateOrganizationProfileDto,
  ) {
    if (createProfileDto.profileType !== expectedProfileType) {
      throw new HttpException('Profile type mismatch', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findOne({
      email: createProfileDto.email,
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const role = this.normalizeProfileType(createProfileDto.profileType);
    const newUser = await this.userModel.create({
      email: createProfileDto.email,
      role,
      password: createProfileDto.password,
      fullName: createProfileDto.organizationName,
      phoneNumber: createProfileDto.phoneNumber,
      address: createProfileDto.address,
      city: createProfileDto.city,
      status: 'pending',
    });

    const { password: _password, ...profileData } = createProfileDto;
    void _password;
    const completion = this.getCompletion({ ...profileData });
    return this.organizationProfileModel.create({
      ...profileData,
      userId: newUser._id,
      status: 'pending',
      ...completion,
    });
  }

  async getMyOrganizationProfile(userId: string, role: UserRole) {
    if (!this.isOrganizationProfileType(role)) {
      throw new HttpException(
        'Organization profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.findOrganizationProfile(userId, role);
  }

  async updateMyOrganizationProfile(
    userId: string,
    role: UserRole,
    updateProfileDto: UpdateOrganizationProfileDto,
  ) {
    if (!this.isOrganizationProfileType(role)) {
      throw new HttpException(
        'Organization profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const currentProfile = await this.findOrganizationProfile(userId, role);
    const {
      password: _password,
      profileType: _profileType,
      ...profileData
    } = updateProfileDto;
    void _password;
    void _profileType;
    const completion = this.getCompletion({
      ...currentProfile.toObject?.(),
      ...profileData,
    });

    const updatedProfile = await this.organizationProfileModel.findOneAndUpdate(
      { userId, profileType: role },
      {
        ...profileData,
        profileType: role,
        ...completion,
      },
      { new: true },
    );

    await this.syncOrganizationUser(userId, profileData);
    return updatedProfile;
  }

  async getAdminProfiles(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions: Record<string, unknown> = {};
    const { role, status, search } = params;

    if (role) whereConditions.role = role;
    if (status) whereConditions.status = status;
    if (search) {
      whereConditions.$or = ['fullName', 'email', 'city', 'address'].map(
        (field) => ({
          [field]: { $regex: search, $options: 'i' },
        }),
      );
    }

    const [total, users] = await Promise.all([
      this.userModel.countDocuments(whereConditions),
      this.userModel
        .find(whereConditions)
        .select('fullName email role status city address createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: users.map((user: any) => ({
        id: user._id,
        name: user.fullName || '',
        email: user.email,
        role: user.role,
        status: user.status,
        location: [user.city, user.address].filter(Boolean).join(', '),
        createdAt: user.createdAt,
      })),
    };
  }

  async getAdminProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -otp -otpExpiry -verifiedForget -__v')
      .lean();

    if (!user) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    const role = (user as { role?: UserRole }).role;
    let profile: unknown = null;

    if (role === 'family') {
      profile = await this.familyModel.findOne({ userId }).lean();
    } else if (role === 'care_company') {
      profile = await this.companyModel.findOne({ userId }).lean();
    } else if (role === 'carer') {
      profile = await this.careModel.findOne({ userId }).lean();
    } else if (this.isOrganizationProfileType(role)) {
      profile = await this.organizationProfileModel
        .findOne({ userId, profileType: role })
        .lean();
    }

    return { user, profile };
  }

  async updateProfileStatus(
    action: ProfileAuditAction,
    actorUserId: string,
    dto: AdminProfileActionDto,
  ) {
    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    const previousStatus = user.status;
    const nextStatus = STATUS_BY_ACTION[action];
    user.status = nextStatus;
    await user.save();

    await this.updateBackingProfileStatus(String(user._id), user.role, action);

    await this.profileAuditLogModel.create({
      actorUserId,
      targetUserId: dto.userId,
      targetRole: user.role,
      action,
      previousStatus,
      nextStatus,
      reason: dto.reason,
    });

    if (action === 'approve-profile' || action === 'reject-profile') {
      await this.notificationService.notifyEmail({
        event:
          action === 'approve-profile'
            ? 'profile_approved'
            : 'profile_rejected',
        recipientEmail: user.email,
        recipientName: user.fullName,
        recipientUserId: String(user._id),
        templateData: {
          profileRole: user.role,
          reason: dto.reason,
        },
        metadata: {
          actorUserId,
          targetUserId: dto.userId,
          previousStatus,
          nextStatus,
          action,
        },
      });
    }

    return {
      userId: dto.userId,
      role: user.role,
      previousStatus,
      status: nextStatus,
      action,
    };
  }

  private async updateBackingProfileStatus(
    userId: string,
    role: UserRole,
    action: ProfileAuditAction,
  ) {
    const profileStatusByAction: Record<ProfileAuditAction, ProfileStatus> = {
      'approve-profile': 'approved',
      'reject-profile': 'rejected',
      'suspend-profile': 'suspended',
      'reactivate-profile': 'approved',
    };
    const status = profileStatusByAction[action];

    if (role === 'care_company') {
      await this.companyModel.findOneAndUpdate({ userId }, { status });
      return;
    }

    if (this.isOrganizationProfileType(role)) {
      await this.organizationProfileModel.findOneAndUpdate(
        { userId, profileType: role },
        { status },
      );
    }
  }

  private buildSearchConditions(
    params: IFilterParams,
    textFields: string[],
  ): Record<string, unknown> {
    const whereConditions: Record<string, unknown> = {};
    const { search, city, postCode } = params;

    if (search) {
      whereConditions.$or = textFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }
    if (city) {
      whereConditions.city = { $regex: city, $options: 'i' };
    }
    if (postCode) {
      whereConditions.postCode = { $regex: postCode, $options: 'i' };
    }

    return whereConditions;
  }

  async searchCareCompanies(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions: Record<string, unknown> = {
      ...this.buildSearchConditions(params, [
        'companyName',
        'email',
        'address',
        'postCode',
      ]),
      status: 'approved' as const,
    };

    const [total, companies] = await Promise.all([
      this.companyModel.countDocuments(whereConditions),
      this.companyModel
        .find(whereConditions)
        .select(
          'companyName email phoneNumber address postCode websiteLink logo coverPhoto coverageRegions serviceOffered status profileCompletionStatus createdAt',
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: companies.map((company: any) => ({
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        phoneNumber: company.phoneNumber,
        address: company.address,
        postCode: company.postCode,
        websiteLink: company.websiteLink,
        logo: company.logo,
        coverPhoto: company.coverPhoto,
        coverageRegions: company.coverageRegions || [],
        serviceOffered: company.serviceOffered || [],
        status: company.status,
        profileCompletionStatus: company.profileCompletionStatus,
        createdAt: company.createdAt,
      })),
    };
  }

  async searchOrganizationDirectory(
    profileType: OrganizationProfileType,
    params: IFilterParams,
    options: IOptions,
  ) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions: Record<string, unknown> = {
      ...this.buildSearchConditions(params, [
        'organizationName',
        'email',
        'address',
        'city',
        'postCode',
        'services',
      ]),
      profileType,
      status: 'approved',
    };

    const [total, profiles] = await Promise.all([
      this.organizationProfileModel.countDocuments(whereConditions as any),
      this.organizationProfileModel
        .find(whereConditions as any)
        .select(
          'organizationName email phoneNumber address city postCode websiteLink description services status profileCompletionStatus createdAt',
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: profiles.map((profile: any) => ({
        id: profile._id,
        organizationName: profile.organizationName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        city: profile.city,
        postCode: profile.postCode,
        websiteLink: profile.websiteLink,
        description: profile.description,
        services: profile.services || [],
        status: profile.status,
        profileCompletionStatus: profile.profileCompletionStatus,
        createdAt: profile.createdAt,
      })),
    };
  }

  private async assertRestrictedCarerDirectoryAccess(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('role status')
      .lean();
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const role = (user as { role?: UserRole }).role;
    const status = (user as { status?: UserStatus }).status;
    const allowedRoles: UserRole[] = [
      'care_company',
      'agency',
      'supplier',
      'service_provider',
    ];

    if (!role || !allowedRoles.includes(role) || status !== 'active') {
      throw new HttpException(
        'Restricted carer directory requires an approved organization account',
        HttpStatus.FORBIDDEN,
      );
    }

    if (role === 'care_company') {
      const approvedCompany = await this.companyModel.findOne({
        userId,
        status: 'approved',
      });
      if (!approvedCompany) {
        throw new HttpException(
          'Restricted carer directory requires an approved organization account',
          HttpStatus.FORBIDDEN,
        );
      }
    } else if (this.isOrganizationProfileType(role)) {
      const approvedProfile = await this.organizationProfileModel.findOne({
        userId,
        profileType: role,
        status: 'approved',
      });
      if (!approvedProfile) {
        throw new HttpException(
          'Restricted carer directory requires an approved organization account',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const activeEntitlement = await this.entitlementModel
      .findOne({
        user: userId,
        status: 'active',
        endDate: { $gte: new Date() },
      })
      .populate('package');

    if (!activeEntitlement) {
      throw new HttpException(
        'Restricted carer directory requires an active paid membership',
        HttpStatus.FORBIDDEN,
      );
    }

    const pkg = activeEntitlement.package as unknown as { type?: string };
    if (pkg?.type !== 'membership') {
      throw new HttpException(
        'Restricted carer directory requires an active membership package',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async searchRestrictedCarers(
    requesterUserId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    await this.assertRestrictedCarerDirectoryAccess(requesterUserId);

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const {
      search,
      city,
      postCode,
      skills,
      specialisms,
      yearsOfExperience,
      isAvailable,
      hasDrivingLicense,
      hasVehicle,
      shifts,
    } = params;
    const whereConditions: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      whereConditions.$or = ['careName', 'address', 'postCode'].map(
        (field) => ({
          [field]: { $regex: search, $options: 'i' },
        }),
      );
    }
    if (city) whereConditions.address = { $regex: city, $options: 'i' };
    if (postCode)
      whereConditions.postCode = { $regex: postCode, $options: 'i' };
    if (skills) whereConditions.skills = { $in: String(skills).split(',') };
    if (specialisms) {
      whereConditions.specialisms = { $in: String(specialisms).split(',') };
    }
    if (yearsOfExperience) {
      whereConditions.yearsOfExperience = { $gte: Number(yearsOfExperience) };
    }
    if (typeof isAvailable !== 'undefined') {
      whereConditions.isAvailable = String(isAvailable) === 'true';
    }
    if (typeof hasDrivingLicense !== 'undefined') {
      whereConditions.hasDrivingLicense = String(hasDrivingLicense) === 'true';
    }
    if (typeof hasVehicle !== 'undefined') {
      whereConditions.hasVehicle = String(hasVehicle) === 'true';
    }
    if (shifts) whereConditions.shifts = shifts;

    const [total, carers] = await Promise.all([
      this.careModel.countDocuments(whereConditions),
      this.careModel
        .find(whereConditions)
        .select(
          'careName profilePicture phoneNumber email hasDrivingLicense hasVehicle address postCode shifts specialisms yearsOfExperience skills isAvailable profileCompletionStatus createdAt',
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: carers.map((carer: any) => ({
        id: carer._id,
        careName: carer.careName,
        profilePicture: carer.profilePicture,
        phoneNumber: carer.phoneNumber,
        email: carer.email,
        hasDrivingLicense: carer.hasDrivingLicense,
        hasVehicle: carer.hasVehicle,
        address: carer.address,
        postCode: carer.postCode,
        shifts: carer.shifts,
        specialisms: carer.specialisms || [],
        yearsOfExperience: carer.yearsOfExperience,
        skills: carer.skills || [],
        isAvailable: carer.isAvailable,
        profileCompletionStatus: carer.profileCompletionStatus,
        createdAt: carer.createdAt,
      })),
    };
  }
}

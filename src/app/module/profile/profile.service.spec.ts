import { ProfileService } from './profile.service';

const buildUserModel = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
});

const buildOrganizationProfileModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
});

const buildAuditLogModel = () => ({
  create: jest.fn(),
});

const buildProfileModel = () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
});

const buildPaymentModel = () => ({
  findOne: jest.fn(),
});

const buildEntitlementModel = () => ({
  findOne: jest.fn(),
  updateMany: jest.fn(),
});

const buildPackageModel = () => ({
  findById: jest.fn(),
});

const buildFindChain = (items: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

const makeProfileService = (overrides: Record<string, unknown> = {}) => {
  const defaults = {
    userModel: buildUserModel(),
    organizationProfileModel: buildOrganizationProfileModel(),
    auditLogModel: buildAuditLogModel(),
    familyModel: buildProfileModel(),
    companyModel: buildProfileModel(),
    careModel: buildProfileModel(),
    paymentModel: buildPaymentModel(),
    entitlementModel: buildEntitlementModel(),
    packageModel: buildPackageModel(),
  };
  const models = { ...defaults, ...overrides };
  return {
    service: new ProfileService(
      models.userModel as any,
      models.organizationProfileModel as any,
      models.auditLogModel as any,
      models.familyModel as any,
      models.companyModel as any,
      models.careModel as any,
      models.paymentModel as any,
      models.entitlementModel as any,
      models.packageModel as any,
    ),
    ...models,
  };
};

describe('ProfileService', () => {
  it('creates a linked recruitment agency profile with completion status', async () => {
    const { service, userModel, organizationProfileModel } =
      makeProfileService();
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ _id: 'new-user-id' });
    organizationProfileModel.create.mockResolvedValue({
      _id: 'profile-id',
      userId: 'new-user-id',
      profileType: 'agency',
      profileCompletionStatus: 'complete',
    });

    const result = await service.createOrganizationProfile('agency', {
      profileType: 'agency',
      organizationName: 'Bedders Recruitment Ltd',
      email: 'agency@example.com',
      password: 'secret123',
      phoneNumber: '+447700900123',
      address: '221B Baker Street',
    });

    expect(userModel.create).toHaveBeenCalledWith({
      email: 'agency@example.com',
      role: 'agency',
      password: 'secret123',
      fullName: 'Bedders Recruitment Ltd',
      phoneNumber: '+447700900123',
      address: '221B Baker Street',
      city: undefined,
      status: 'pending',
    });
    expect(organizationProfileModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'new-user-id',
        profileType: 'agency',
        profileCompletionStatus: 'complete',
        profileCompletionPercentage: 100,
      }),
    );
    expect(organizationProfileModel.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: 'secret123' }),
    );
    expect(result).toMatchObject({
      _id: 'profile-id',
      userId: 'new-user-id',
      profileType: 'agency',
    });
  });

  it('rejects organization profile type mismatch', async () => {
    const { service } = makeProfileService();

    await expect(
      service.createOrganizationProfile('agency', {
        profileType: 'supplier',
        organizationName: 'Supplier Ltd',
        email: 'supplier@example.com',
        password: 'secret123',
      }),
    ).rejects.toMatchObject({
      message: 'Profile type mismatch',
      status: 400,
    });
  });

  it('approves a profile and writes an audit log', async () => {
    const { service, userModel, organizationProfileModel, auditLogModel } =
      makeProfileService();
    const targetUser = {
      _id: 'target-user-id',
      role: 'agency',
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };
    userModel.findById.mockResolvedValue(targetUser);

    const result = await service.updateProfileStatus(
      'approve-profile',
      'admin-user-id',
      {
        userId: 'target-user-id',
        reason: 'Verified',
      },
    );

    expect(targetUser.status).toBe('active');
    expect(targetUser.save).toHaveBeenCalled();
    expect(organizationProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'target-user-id', profileType: 'agency' },
      { status: 'approved' },
    );
    expect(auditLogModel.create).toHaveBeenCalledWith({
      actorUserId: 'admin-user-id',
      targetUserId: 'target-user-id',
      targetRole: 'agency',
      action: 'approve-profile',
      previousStatus: 'pending',
      nextStatus: 'active',
      reason: 'Verified',
    });
    expect(result).toMatchObject({
      userId: 'target-user-id',
      role: 'agency',
      previousStatus: 'pending',
      status: 'active',
      action: 'approve-profile',
    });
  });

  it('searches approved public care companies without private fields', async () => {
    const { service, companyModel } = makeProfileService();
    companyModel.countDocuments.mockResolvedValue(1);
    companyModel.find.mockReturnValue(
      buildFindChain([
        {
          _id: 'company-id',
          companyName: 'Approved Care Ltd',
          email: 'company@example.com',
          phoneNumber: '+447700900123',
          address: 'London',
          postCode: 'SW1A 1AA',
          status: 'approved',
        },
      ]),
    );

    const result = await service.searchCareCompanies(
      { search: 'Approved' },
      { page: 1, limit: 10 },
    );

    expect(companyModel.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved' }),
    );
    expect(result.data[0]).toMatchObject({
      id: 'company-id',
      companyName: 'Approved Care Ltd',
      status: 'approved',
    });
    expect(result.data[0]).not.toHaveProperty('supportingDocuments');
  });

  it('denies restricted carer search when requester has no active entitlement', async () => {
    const { service, userModel, organizationProfileModel, entitlementModel } =
      makeProfileService();
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: 'requester-id',
        role: 'agency',
        status: 'active',
      }),
    });
    organizationProfileModel.findOne.mockResolvedValue({
      _id: 'approved-profile-id',
      status: 'approved',
    });
    entitlementModel.updateMany.mockResolvedValue(undefined);
    entitlementModel.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.searchRestrictedCarers(
        'requester-id',
        {},
        { page: 1, limit: 10 },
      ),
    ).rejects.toMatchObject({
      message: 'Restricted carer directory requires an active paid membership',
      status: 403,
    });
  });

  it('denies restricted carer search when entitlement is for wrong package type', async () => {
    const { service, userModel, organizationProfileModel, entitlementModel } =
      makeProfileService();
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: 'requester-id',
        role: 'agency',
        status: 'active',
      }),
    });
    organizationProfileModel.findOne.mockResolvedValue({
      _id: 'approved-profile-id',
      status: 'approved',
    });
    entitlementModel.updateMany.mockResolvedValue(undefined);
    entitlementModel.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'entitlement-id',
        status: 'active',
        package: { _id: 'pkg-id', type: 'job_posting' },
      }),
    });

    await expect(
      service.searchRestrictedCarers(
        'requester-id',
        {},
        { page: 1, limit: 10 },
      ),
    ).rejects.toMatchObject({
      message:
        'Restricted carer directory requires an active membership package',
      status: 403,
    });
  });

  it('searches restricted carers for paid approved organizations with membership entitlement', async () => {
    const {
      service,
      userModel,
      organizationProfileModel,
      entitlementModel,
      careModel,
    } = makeProfileService();
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: 'requester-id',
        role: 'agency',
        status: 'active',
      }),
    });
    organizationProfileModel.findOne.mockResolvedValue({
      _id: 'approved-profile-id',
      status: 'approved',
    });
    entitlementModel.updateMany.mockResolvedValue(undefined);
    entitlementModel.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'entitlement-id',
        status: 'active',
        package: { _id: 'pkg-id', type: 'membership' },
      }),
    });
    careModel.countDocuments.mockResolvedValue(1);
    careModel.find.mockReturnValue(
      buildFindChain([
        {
          _id: 'care-id',
          careName: 'Jane Carer',
          email: 'carer@example.com',
          skills: ['First Aid'],
          specialisms: ['Dementia Care'],
          isAvailable: true,
          isActive: true,
        },
      ]),
    );

    const result = await service.searchRestrictedCarers(
      'requester-id',
      { skills: 'First Aid', isAvailable: 'true' },
      { page: 1, limit: 10 },
    );

    expect(careModel.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        skills: { $in: ['First Aid'] },
        isAvailable: true,
      }),
    );
    expect(result.data[0]).toMatchObject({
      id: 'care-id',
      careName: 'Jane Carer',
      skills: ['First Aid'],
    });
  });
});

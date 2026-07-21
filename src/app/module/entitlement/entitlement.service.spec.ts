import { EntitlementService } from './entitlement.service';

const buildEntitlementModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  updateMany: jest.fn(),
  findById: jest.fn(),
});

const buildPackageModel = () => ({
  findById: jest.fn(),
});

const buildFindChain = (items: unknown[]) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

describe('EntitlementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('activates an entitlement for a valid package', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    packageModel.findById.mockResolvedValue({
      _id: 'pkg-id',
      type: 'membership',
      durationDays: 30,
      usageLimit: 0,
    });
    entitlementModel.findOne.mockResolvedValue(null);
    entitlementModel.create.mockResolvedValue({
      _id: 'entitlement-id',
      user: 'user-id',
      package: 'pkg-id',
      payment: 'payment-id',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageCount: 0,
      usageLimit: 0,
    });
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.activateEntitlement(
      'user-id',
      'pkg-id',
      'payment-id',
    );

    expect(entitlementModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'user-id',
        package: 'pkg-id',
        payment: 'payment-id',
        status: 'active',
      }),
    );
    expect(result).toMatchObject({
      _id: 'entitlement-id',
      status: 'active',
    });
  });

  it('returns existing active entitlement if already activated', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    packageModel.findById.mockResolvedValue({
      _id: 'pkg-id',
      type: 'membership',
      durationDays: 30,
    });
    const existingEntitlement = {
      _id: 'existing-entitlement',
      user: 'user-id',
      package: 'pkg-id',
      status: 'active',
    };
    entitlementModel.findOne.mockResolvedValue(existingEntitlement);
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.activateEntitlement(
      'user-id',
      'pkg-id',
      'payment-id',
    );

    expect(entitlementModel.create).not.toHaveBeenCalled();
    expect(result).toMatchObject(existingEntitlement);
  });

  it('returns null when package not found during activation', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    packageModel.findById.mockResolvedValue(null);
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.activateEntitlement(
      'user-id',
      'missing-pkg',
      'payment-id',
    );

    expect(result).toBeNull();
    expect(entitlementModel.create).not.toHaveBeenCalled();
  });

  it('gets user entitlements', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    entitlementModel.updateMany.mockResolvedValue(undefined);
    entitlementModel.find.mockReturnValue(
      buildFindChain([
        {
          _id: 'entitlement-id',
          user: 'user-id',
          package: { _id: 'pkg-id', type: 'membership' },
          status: 'active',
        },
      ]),
    );
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.getMyEntitlements('user-id');

    expect(entitlementModel.updateMany).toHaveBeenCalledWith(
      {
        user: 'user-id',
        status: 'active',
        endDate: { $lt: expect.any(Date) },
      },
      { status: 'expired' },
    );
    expect(result).toHaveLength(1);
  });

  it('checks active entitlement by package type', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    entitlementModel.updateMany.mockResolvedValue(undefined);
    const mockPopulate = jest.fn().mockResolvedValue({
      _id: 'entitlement-id',
      user: 'user-id',
      status: 'active',
      package: { _id: 'pkg-id', type: 'membership' },
    });
    entitlementModel.findOne.mockReturnValue({
      populate: mockPopulate,
    });
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.hasActiveEntitlement('user-id', 'membership');

    expect(result).toBe(true);
  });

  it('returns false when no matching entitlement type', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    entitlementModel.updateMany.mockResolvedValue(undefined);
    const mockPopulate = jest.fn().mockResolvedValue(null);
    entitlementModel.findOne.mockReturnValue({
      populate: mockPopulate,
    });
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.hasActiveEntitlement('user-id', 'job_posting');

    expect(result).toBe(false);
  });

  it('increments usage count within limit', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    const mockEntitlement = {
      _id: 'entitlement-id',
      usageCount: 2,
      usageLimit: 10,
      save: jest.fn().mockResolvedValue(undefined),
    };
    entitlementModel.findById.mockResolvedValue(mockEntitlement);
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    await service.incrementUsage('entitlement-id');

    expect(mockEntitlement.usageCount).toBe(3);
    expect(mockEntitlement.save).toHaveBeenCalled();
  });

  it('throws when usage limit reached', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    const mockEntitlement = {
      _id: 'entitlement-id',
      usageCount: 10,
      usageLimit: 10,
      save: jest.fn(),
    };
    entitlementModel.findById.mockResolvedValue(mockEntitlement);
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    await expect(
      service.incrementUsage('entitlement-id'),
    ).rejects.toMatchObject({
      message: 'Usage limit reached for this package',
      status: 400,
    });
    expect(mockEntitlement.save).not.toHaveBeenCalled();
  });

  it('allows unlimited usage when usageLimit is 0', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    const mockEntitlement = {
      _id: 'entitlement-id',
      usageCount: 999,
      usageLimit: 0,
      save: jest.fn().mockResolvedValue(undefined),
    };
    entitlementModel.findById.mockResolvedValue(mockEntitlement);
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    const result = await service.incrementUsage('entitlement-id');

    expect(mockEntitlement.usageCount).toBe(1000);
    expect(result).toMatchObject(mockEntitlement);
  });

  it('checks usage limit correctly', async () => {
    const entitlementModel = buildEntitlementModel();
    const packageModel = buildPackageModel();
    entitlementModel.findById.mockResolvedValue({
      _id: 'entitlement-id',
      status: 'active',
      usageCount: 5,
      usageLimit: 10,
    });
    const service = new EntitlementService(
      entitlementModel as any,
      packageModel as any,
    );

    expect(await service.checkUsageLimit('entitlement-id')).toBe(true);

    entitlementModel.findById.mockResolvedValue({
      _id: 'entitlement-id',
      status: 'active',
      usageCount: 10,
      usageLimit: 10,
    });
    expect(await service.checkUsageLimit('entitlement-id')).toBe(false);

    entitlementModel.findById.mockResolvedValue(null);
    expect(await service.checkUsageLimit('missing-id')).toBe(false);
  });
});

import { HttpException } from '@nestjs/common';
import { PackageService } from './package.service';

const buildPackageModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
});

const buildFindChain = (items: unknown[]) => ({
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

describe('PackageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new package successfully', async () => {
    const packageModel = buildPackageModel();
    packageModel.findOne.mockResolvedValue(null);
    packageModel.create.mockResolvedValue({
      _id: 'pkg-id',
      name: 'Gold Membership',
      type: 'membership',
      price: 99.99,
      isActive: true,
    });
    const service = new PackageService(packageModel as any);

    const result = await service.createPackage({
      name: 'Gold Membership',
      type: 'membership',
      price: 99.99,
      description: 'Full access',
      features: ['Restricted carer search'],
      durationDays: 30,
      usageLimit: 0,
    });

    expect(packageModel.findOne).toHaveBeenCalledWith({
      name: 'Gold Membership',
      type: 'membership',
    });
    expect(packageModel.create).toHaveBeenCalledWith({
      name: 'Gold Membership',
      type: 'membership',
      price: 99.99,
      description: 'Full access',
      features: ['Restricted carer search'],
      durationDays: 30,
      usageLimit: 0,
    });
    expect(result).toMatchObject({
      _id: 'pkg-id',
      name: 'Gold Membership',
      type: 'membership',
    });
  });

  it('rejects duplicate package name and type', async () => {
    const packageModel = buildPackageModel();
    packageModel.findOne.mockResolvedValue({
      _id: 'existing-pkg',
      name: 'Gold Membership',
      type: 'membership',
    });
    const service = new PackageService(packageModel as any);

    await expect(
      service.createPackage({
        name: 'Gold Membership',
        type: 'membership',
        price: 99.99,
      }),
    ).rejects.toMatchObject<HttpException>({
      message: 'A package with this name and type already exists',
      status: 400,
    });
    expect(packageModel.create).not.toHaveBeenCalled();
  });

  it('gets a single package by id', async () => {
    const packageModel = buildPackageModel();
    packageModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'pkg-id',
        name: 'Gold Membership',
        type: 'membership',
        price: 99.99,
      }),
    });
    const service = new PackageService(packageModel as any);

    const result = await service.getPackage('pkg-id');

    expect(packageModel.findById).toHaveBeenCalledWith('pkg-id');
    expect(result).toMatchObject({
      _id: 'pkg-id',
      name: 'Gold Membership',
    });
  });

  it('throws not found when package does not exist', async () => {
    const packageModel = buildPackageModel();
    packageModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    const service = new PackageService(packageModel as any);

    await expect(service.getPackage('missing-id')).rejects.toMatchObject({
      message: 'Package not found',
      status: 404,
    });
  });

  it('updates a package successfully', async () => {
    const packageModel = buildPackageModel();
    packageModel.findById
      .mockResolvedValueOnce({
        _id: 'pkg-id',
        name: 'Gold Membership',
        type: 'membership',
        price: 99.99,
      })
      .mockResolvedValueOnce(null);
    packageModel.findByIdAndUpdate.mockResolvedValue({
      _id: 'pkg-id',
      name: 'Gold Membership Updated',
      type: 'membership',
      price: 149.99,
    });
    const service = new PackageService(packageModel as any);

    const result = await service.updatePackage('pkg-id', {
      name: 'Gold Membership Updated',
      price: 149.99,
    });

    expect(packageModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'pkg-id',
      { name: 'Gold Membership Updated', price: 149.99 },
      { new: true },
    );
    expect(result).toMatchObject({
      _id: 'pkg-id',
      name: 'Gold Membership Updated',
    });
  });

  it('disables a package successfully', async () => {
    const packageModel = buildPackageModel();
    const mockPackage = {
      _id: 'pkg-id',
      name: 'Gold Membership',
      isActive: true,
      save: jest.fn().mockResolvedValue(undefined),
    };
    packageModel.findById.mockResolvedValue(mockPackage);
    const service = new PackageService(packageModel as any);

    const result = await service.disablePackage('pkg-id');

    expect(mockPackage.isActive).toBe(false);
    expect(mockPackage.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      _id: 'pkg-id',
      isActive: false,
    });
  });

  it('throws not found when disabling non-existent package', async () => {
    const packageModel = buildPackageModel();
    packageModel.findById.mockResolvedValue(null);
    const service = new PackageService(packageModel as any);

    await expect(service.disablePackage('missing-id')).rejects.toMatchObject({
      message: 'Package not found',
      status: 404,
    });
  });

  it('gets active packages for public view', async () => {
    const packageModel = buildPackageModel();
    packageModel.countDocuments.mockResolvedValue(2);
    packageModel.find.mockReturnValue(
      buildFindChain([
        { _id: 'pkg-1', name: 'Basic', type: 'membership', isActive: true },
        { _id: 'pkg-2', name: 'Premium', type: 'membership', isActive: true },
      ]),
    );
    const service = new PackageService(packageModel as any);

    const result = await service.getPackages(
      { searchTerm: '' },
      { page: 1, limit: 10 },
    );

    expect(packageModel.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    );
    expect(result.meta.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });
});

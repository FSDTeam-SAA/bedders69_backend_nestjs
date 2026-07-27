import { AdvertisementService } from './advertisement.service';

const buildAdvertisementModel = () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
});

const buildAuditLogModel = () => ({
  create: jest.fn(),
});

const buildUserModel = () => ({
  findById: jest.fn(),
});

const buildEntitlementModel = () => ({
  find: jest.fn(),
  updateMany: jest.fn(),
});

const buildNotificationService = () => ({
  notifyEmail: jest.fn().mockResolvedValue({ _id: 'notification-id' }),
});

const buildFindChain = (items: unknown[]) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

const buildEntitlementFindChain = (items: unknown[]) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(items),
});

const buildService = () => {
  const advertisementModel = buildAdvertisementModel();
  const auditLogModel = buildAuditLogModel();
  const userModel = buildUserModel();
  const entitlementModel = buildEntitlementModel();
  const notificationService = buildNotificationService();
  const service = new AdvertisementService(
    advertisementModel as any,
    auditLogModel as any,
    userModel as any,
    entitlementModel as any,
    notificationService as any,
  );

  return {
    service,
    advertisementModel,
    auditLogModel,
    userModel,
    entitlementModel,
    notificationService,
  };
};

describe('AdvertisementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAdvertisement', () => {
    it('creates a pending advertisement for an active organization with entitlement', async () => {
      const { service, advertisementModel, userModel, entitlementModel } =
        buildService();
      const entitlement = {
        _id: 'entitlement-id',
        package: { type: 'advertisement' },
        usageCount: 0,
        usageLimit: 2,
        save: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'advertiser-id',
          role: 'supplier',
          status: 'active',
        }),
      });
      entitlementModel.updateMany.mockResolvedValue({});
      entitlementModel.find.mockReturnValue(
        buildEntitlementFindChain([entitlement]),
      );
      advertisementModel.create.mockResolvedValue({
        _id: 'ad-id',
        status: 'pending_approval',
      });

      const result = await service.createAdvertisement('advertiser-id', {
        title: 'Care bed sale',
        placement: 'marketplace_top',
        startsAt: '2026-08-01T00:00:00.000Z',
        endsAt: '2026-08-31T00:00:00.000Z',
      });

      expect(advertisementModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Care bed sale',
          advertiserUserId: 'advertiser-id',
          entitlementId: 'entitlement-id',
          status: 'pending_approval',
          isActive: true,
          impressionCount: 0,
          clickCount: 0,
        }),
      );
      expect(entitlement.usageCount).toBe(1);
      expect(entitlement.save).toHaveBeenCalled();
      expect(result).toMatchObject({ _id: 'ad-id' });
    });

    it('rejects creation without an advertisement entitlement', async () => {
      const { service, advertisementModel, userModel, entitlementModel } =
        buildService();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'advertiser-id',
          role: 'supplier',
          status: 'active',
        }),
      });
      entitlementModel.updateMany.mockResolvedValue({});
      entitlementModel.find.mockReturnValue(buildEntitlementFindChain([]));

      await expect(
        service.createAdvertisement('advertiser-id', {
          title: 'Care bed sale',
          placement: 'marketplace_top',
          startsAt: '2026-08-01T00:00:00.000Z',
          endsAt: '2026-08-31T00:00:00.000Z',
        }),
      ).rejects.toMatchObject({
        message: 'Active advertisement entitlement required',
        status: 403,
      });
      expect(advertisementModel.create).not.toHaveBeenCalled();
    });

    it('rejects invalid date windows', async () => {
      const { service, userModel } = buildService();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'advertiser-id',
          role: 'agency',
          status: 'active',
        }),
      });

      await expect(
        service.createAdvertisement('advertiser-id', {
          title: 'Bad dates',
          placement: 'marketplace_top',
          startsAt: '2026-08-31T00:00:00.000Z',
          endsAt: '2026-08-01T00:00:00.000Z',
        }),
      ).rejects.toMatchObject({
        message: 'Advertisement end date must be after start date',
        status: 400,
      });
    });
  });

  describe('updateAdvertisement', () => {
    it('updates an advertiser-owned pending advertisement', async () => {
      const { service, advertisementModel } = buildService();
      advertisementModel.findById.mockResolvedValue({
        _id: 'ad-id',
        advertiserUserId: 'advertiser-id',
        status: 'pending_approval',
        startsAt: new Date('2026-08-01T00:00:00.000Z'),
        endsAt: new Date('2026-08-31T00:00:00.000Z'),
      });
      advertisementModel.findByIdAndUpdate.mockResolvedValue({
        _id: 'ad-id',
        title: 'Updated title',
      });

      const result = await service.updateAdvertisement(
        'ad-id',
        'advertiser-id',
        { title: 'Updated title' },
      );

      expect(result).toMatchObject({ title: 'Updated title' });
    });

    it('rejects update from a non-owner', async () => {
      const { service, advertisementModel } = buildService();
      advertisementModel.findById.mockResolvedValue({
        _id: 'ad-id',
        advertiserUserId: 'other-advertiser',
        status: 'pending_approval',
        startsAt: new Date('2026-08-01T00:00:00.000Z'),
        endsAt: new Date('2026-08-31T00:00:00.000Z'),
      });

      await expect(
        service.updateAdvertisement('ad-id', 'advertiser-id', {
          title: 'Updated title',
        }),
      ).rejects.toMatchObject({
        message: 'You can only update your own advertisements',
        status: 403,
      });
    });
  });

  describe('admin approval', () => {
    it('approves a pending advertisement and writes audit log', async () => {
      const {
        service,
        advertisementModel,
        auditLogModel,
        userModel,
        notificationService,
      } = buildService();
      const advertisement = {
        _id: 'ad-id',
        advertiserUserId: 'advertiser-id',
        title: 'Care bed sale',
        status: 'pending_approval',
        isActive: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      advertisementModel.findById.mockResolvedValue(advertisement);
      auditLogModel.create.mockResolvedValue({});
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'advertiser-id',
          fullName: 'Advertiser',
          email: 'ads@example.com',
        }),
      });

      const result = await service.approveAdvertisement(
        'admin-id',
        'ad-id',
        'Approved',
      );

      expect(advertisement.status).toBe('approved');
      expect(advertisement.isActive).toBe(true);
      expect(advertisement.approvedAt).toBeInstanceOf(Date);
      expect(auditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: 'admin-id',
          advertisementId: 'ad-id',
          action: 'approve-advertisement',
          previousStatus: 'pending_approval',
          nextStatus: 'approved',
        }),
      );
      expect(notificationService.notifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'advertisement_approved',
          recipientEmail: 'ads@example.com',
          recipientUserId: 'advertiser-id',
        }),
      );
      expect(result).toMatchObject({ status: 'approved' });
    });

    it('rejects a pending advertisement and writes audit log', async () => {
      const {
        service,
        advertisementModel,
        auditLogModel,
        userModel,
        notificationService,
      } = buildService();
      const advertisement = {
        _id: 'ad-id',
        advertiserUserId: 'advertiser-id',
        title: 'Care bed sale',
        status: 'pending_approval',
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      advertisementModel.findById.mockResolvedValue(advertisement);
      auditLogModel.create.mockResolvedValue({});
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'advertiser-id',
          fullName: 'Advertiser',
          email: 'ads@example.com',
        }),
      });

      await service.rejectAdvertisement('admin-id', 'ad-id', 'Bad creative');

      expect(advertisement.status).toBe('rejected');
      expect(advertisement.isActive).toBe(false);
      expect(advertisement.rejectedReason).toBe('Bad creative');
      expect(auditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reject-advertisement',
          nextStatus: 'rejected',
        }),
      );
      expect(notificationService.notifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'advertisement_rejected',
          recipientEmail: 'ads@example.com',
          recipientUserId: 'advertiser-id',
        }),
      );
    });
  });

  describe('serving and tracking', () => {
    it('serves only active approved advertisements in date window', async () => {
      const { service, advertisementModel } = buildService();
      advertisementModel.countDocuments.mockResolvedValue(1);
      advertisementModel.find.mockReturnValue(
        buildFindChain([
          {
            _id: 'ad-id',
            title: 'Care bed sale',
            placement: 'marketplace_top',
            assetUrl: 'https://cdn.example.com/ad.jpg',
            impressionCount: 2,
            clickCount: 1,
          },
        ]),
      );

      const result = await service.serveAdvertisements(
        { placement: 'marketplace_top' },
        { page: 1, limit: 10 },
      );

      expect(advertisementModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          isActive: true,
          placement: 'marketplace_top',
        }),
      );
      expect(result.data[0]).toMatchObject({
        id: 'ad-id',
        title: 'Care bed sale',
        impressionCount: 2,
        clickCount: 1,
      });
    });

    it('tracks an advertisement impression', async () => {
      const { service, advertisementModel } = buildService();
      advertisementModel.findOneAndUpdate.mockResolvedValue({
        _id: 'ad-id',
        impressionCount: 4,
      });

      const result = await service.trackAdvertisementImpression('ad-id');

      expect(advertisementModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'ad-id',
          status: 'approved',
          isActive: true,
        }),
        { $inc: { impressionCount: 1 } },
        { new: true },
      );
      expect(result).toMatchObject({
        advertisementId: 'ad-id',
        impressionCount: 4,
      });
    });

    it('tracks an advertisement click and returns target URL', async () => {
      const { service, advertisementModel } = buildService();
      advertisementModel.findOneAndUpdate.mockResolvedValue({
        _id: 'ad-id',
        clickCount: 3,
        targetUrl: 'https://example.com',
      });

      const result = await service.trackAdvertisementClick('ad-id');

      expect(advertisementModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'ad-id',
          status: 'approved',
          isActive: true,
        }),
        { $inc: { clickCount: 1 } },
        { new: true },
      );
      expect(result).toMatchObject({
        advertisementId: 'ad-id',
        clickCount: 3,
        targetUrl: 'https://example.com',
      });
    });
  });
});

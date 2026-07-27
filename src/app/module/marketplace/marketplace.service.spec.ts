import { MarketplaceService } from './marketplace.service';

const buildListingModel = () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
});

const buildInquiryModel = () => ({
  create: jest.fn(),
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
  const listingModel = buildListingModel();
  const inquiryModel = buildInquiryModel();
  const auditLogModel = buildAuditLogModel();
  const userModel = buildUserModel();
  const entitlementModel = buildEntitlementModel();
  const notificationService = buildNotificationService();
  const service = new MarketplaceService(
    listingModel as any,
    inquiryModel as any,
    auditLogModel as any,
    userModel as any,
    entitlementModel as any,
    notificationService as any,
  );

  return {
    service,
    listingModel,
    inquiryModel,
    auditLogModel,
    userModel,
    entitlementModel,
    notificationService,
  };
};

describe('MarketplaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMarketplaceListing', () => {
    it('creates a draft listing for an active seller with entitlement', async () => {
      const { service, listingModel, userModel, entitlementModel } =
        buildService();
      const entitlement = {
        _id: 'entitlement-id',
        package: { type: 'marketplace_listing' },
        usageCount: 0,
        usageLimit: 2,
        save: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'seller-id',
          role: 'supplier',
          status: 'active',
        }),
      });
      entitlementModel.updateMany.mockResolvedValue({});
      entitlementModel.find.mockReturnValue(
        buildEntitlementFindChain([entitlement]),
      );
      listingModel.create.mockResolvedValue({
        _id: 'listing-id',
        sellerUserId: 'seller-id',
        status: 'draft',
      });

      const result = await service.createMarketplaceListing('seller-id', {
        title: 'Care Bed',
        category: 'equipment',
        price: 450,
      });

      expect(listingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Care Bed',
          category: 'equipment',
          sellerUserId: 'seller-id',
          entitlementId: 'entitlement-id',
          status: 'draft',
          isPublished: false,
        }),
      );
      expect(entitlement.usageCount).toBe(1);
      expect(entitlement.save).toHaveBeenCalled();
      expect(result).toMatchObject({ _id: 'listing-id', status: 'draft' });
    });

    it('rejects listing creation when marketplace entitlement is missing', async () => {
      const { service, listingModel, userModel, entitlementModel } =
        buildService();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'seller-id',
          role: 'supplier',
          status: 'active',
        }),
      });
      entitlementModel.updateMany.mockResolvedValue({});
      entitlementModel.find.mockReturnValue(buildEntitlementFindChain([]));

      await expect(
        service.createMarketplaceListing('seller-id', {
          title: 'Care Bed',
          category: 'equipment',
        }),
      ).rejects.toMatchObject({
        message: 'Active marketplace listing entitlement required',
        status: 403,
      });
      expect(listingModel.create).not.toHaveBeenCalled();
    });

    it('rejects listing creation when usage limit is exhausted', async () => {
      const { service, userModel, entitlementModel } = buildService();
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'seller-id',
          role: 'supplier',
          status: 'active',
        }),
      });
      entitlementModel.updateMany.mockResolvedValue({});
      entitlementModel.find.mockReturnValue(
        buildEntitlementFindChain([
          {
            _id: 'entitlement-id',
            package: { type: 'marketplace_listing' },
            usageCount: 1,
            usageLimit: 1,
            save: jest.fn(),
          },
        ]),
      );

      await expect(
        service.createMarketplaceListing('seller-id', {
          title: 'Care Bed',
          category: 'equipment',
        }),
      ).rejects.toMatchObject({
        message: 'Active marketplace listing entitlement required',
        status: 403,
      });
    });
  });

  describe('seller ownership', () => {
    it('updates a seller-owned draft listing', async () => {
      const { service, listingModel } = buildService();
      listingModel.findById.mockResolvedValue({
        _id: 'listing-id',
        sellerUserId: 'seller-id',
        status: 'draft',
      });
      listingModel.findByIdAndUpdate.mockResolvedValue({
        _id: 'listing-id',
        title: 'Updated',
      });

      const result = await service.updateMarketplaceListing(
        'listing-id',
        'seller-id',
        { title: 'Updated' },
      );

      expect(result).toMatchObject({ title: 'Updated' });
    });

    it('rejects update from a non-owner', async () => {
      const { service, listingModel } = buildService();
      listingModel.findById.mockResolvedValue({
        _id: 'listing-id',
        sellerUserId: 'other-seller',
        status: 'draft',
      });

      await expect(
        service.updateMarketplaceListing('listing-id', 'seller-id', {
          title: 'Updated',
        }),
      ).rejects.toMatchObject({
        message: 'You can only update your own marketplace listings',
        status: 403,
      });
    });

    it('soft deletes a seller-owned listing', async () => {
      const { service, listingModel } = buildService();
      const listing = {
        _id: 'listing-id',
        sellerUserId: 'seller-id',
        status: 'approved',
        isPublished: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      listingModel.findById.mockResolvedValue(listing);

      await service.deleteMarketplaceListing('listing-id', 'seller-id');

      expect(listing.status).toBe('deleted');
      expect(listing.isPublished).toBe(false);
      expect(listing.save).toHaveBeenCalled();
    });
  });

  describe('admin approval', () => {
    it('approves a pending marketplace listing and writes audit log', async () => {
      const { service, listingModel, auditLogModel } = buildService();
      const listing = {
        _id: 'listing-id',
        status: 'pending_approval',
        isPublished: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      listingModel.findById.mockResolvedValue(listing);
      auditLogModel.create.mockResolvedValue({});

      const result = await service.approveMarketplaceListing(
        'admin-id',
        'listing-id',
        'Looks good',
      );

      expect(listing.status).toBe('approved');
      expect(listing.isPublished).toBe(true);
      expect(listing.publishedAt).toBeInstanceOf(Date);
      expect(auditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: 'admin-id',
          listingId: 'listing-id',
          action: 'approve-marketplace-listing',
          previousStatus: 'pending_approval',
          nextStatus: 'approved',
          reason: 'Looks good',
        }),
      );
      expect(result).toMatchObject({ status: 'approved' });
    });

    it('rejects a pending marketplace listing and writes audit log', async () => {
      const { service, listingModel, auditLogModel } = buildService();
      const listing = {
        _id: 'listing-id',
        status: 'pending_approval',
        isPublished: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      listingModel.findById.mockResolvedValue(listing);
      auditLogModel.create.mockResolvedValue({});

      await service.rejectMarketplaceListing(
        'admin-id',
        'listing-id',
        'Needs clearer photos',
      );

      expect(listing.status).toBe('rejected');
      expect(listing.rejectedReason).toBe('Needs clearer photos');
      expect(auditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reject-marketplace-listing',
          nextStatus: 'rejected',
        }),
      );
    });
  });

  describe('public listing access', () => {
    it('searches only approved published available listings', async () => {
      const { service, listingModel } = buildService();
      const listing = {
        _id: 'listing-id',
        title: 'Care Bed',
        category: 'equipment',
        sellerUserId: {
          _id: 'seller-id',
          fullName: 'Trusted Supplier',
          email: 'supplier@example.com',
        },
      };
      listingModel.countDocuments.mockResolvedValue(1);
      listingModel.find.mockReturnValue(buildFindChain([listing]));

      const result = await service.searchMarketplaceListings(
        { search: 'bed', city: 'London' },
        { page: 1, limit: 10 },
      );

      expect(listingModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          isPublished: true,
          isAvailable: true,
          city: { $regex: 'London', $options: 'i' },
        }),
      );
      expect(result.data[0]).toMatchObject({
        id: 'listing-id',
        title: 'Care Bed',
        seller: { id: 'seller-id', name: 'Trusted Supplier' },
      });
    });

    it('increments view count when public listing detail is fetched', async () => {
      const { service, listingModel } = buildService();
      listingModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'listing-id',
          title: 'Care Bed',
          category: 'equipment',
          viewCount: 3,
        }),
      });
      listingModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.getMarketplaceListing('listing-id');

      expect(listingModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'listing-id',
        { $inc: { viewCount: 1 } },
      );
      expect(result.viewCount).toBe(4);
    });

    it('creates an inquiry and increments inquiry count', async () => {
      const {
        service,
        listingModel,
        inquiryModel,
        userModel,
        notificationService,
      } = buildService();
      listingModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'listing-id',
          title: 'Care Bed',
          sellerUserId: 'seller-id',
        }),
      });
      inquiryModel.create.mockResolvedValue({
        _id: 'inquiry-id',
        listingId: 'listing-id',
      });
      listingModel.findByIdAndUpdate.mockResolvedValue({});
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'seller-id',
          fullName: 'Seller',
          email: 'seller@example.com',
        }),
      });

      const result = await service.createMarketplaceInquiry(
        'listing-id',
        {
          name: 'Buyer',
          email: 'buyer@example.com',
          message: 'Interested',
        },
        'buyer-id',
      );

      expect(inquiryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          listingId: 'listing-id',
          buyerUserId: 'buyer-id',
          sellerUserId: 'seller-id',
        }),
      );
      expect(listingModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'listing-id',
        { $inc: { inquiryCount: 1 } },
      );
      expect(notificationService.notifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'marketplace_inquiry_created',
          recipientEmail: 'seller@example.com',
          recipientUserId: 'seller-id',
        }),
      );
      expect(result).toMatchObject({ _id: 'inquiry-id' });
    });
  });
});

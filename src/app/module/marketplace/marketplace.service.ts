import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  Entitlement,
  EntitlementDocument,
} from '../entitlement/entities/entitlement.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateMarketplaceListingDto } from './dto/create-marketplace-listing.dto';
import { CreateMarketplaceInquiryDto } from './dto/marketplace-action.dto';
import { UpdateMarketplaceListingDto } from './dto/update-marketplace-listing.dto';
import {
  MarketplaceAuditLog,
  MarketplaceAuditLogDocument,
} from './entities/marketplace-audit-log.entity';
import {
  MarketplaceInquiry,
  MarketplaceInquiryDocument,
} from './entities/marketplace-inquiry.entity';
import {
  MarketplaceListing,
  MarketplaceListingDocument,
} from './entities/marketplace-listing.entity';

type PopulatedMarketplaceEntitlement = EntitlementDocument & {
  package?: { type?: string };
  usageCount: number;
  usageLimit: number;
  save: () => Promise<unknown>;
};

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectModel(MarketplaceListing.name)
    private readonly listingModel: Model<MarketplaceListingDocument>,
    @InjectModel(MarketplaceInquiry.name)
    private readonly inquiryModel: Model<MarketplaceInquiryDocument>,
    @InjectModel(MarketplaceAuditLog.name)
    private readonly auditLogModel: Model<MarketplaceAuditLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Entitlement.name)
    private readonly entitlementModel: Model<EntitlementDocument>,
  ) {}

  async createMarketplaceListing(
    sellerUserId: string,
    dto: CreateMarketplaceListingDto,
  ) {
    const user = await this.userModel.findById(sellerUserId).lean();
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!['supplier', 'service_provider'].includes(user.role)) {
      throw new HttpException(
        'Only suppliers and service providers can create marketplace listings',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status !== 'active') {
      throw new HttpException(
        'Your account must be active to create marketplace listings',
        HttpStatus.FORBIDDEN,
      );
    }

    const entitlement = await this.findUsableEntitlement(sellerUserId);

    const listing = await this.listingModel.create({
      ...dto,
      sellerUserId,
      entitlementId: entitlement._id,
      status: 'draft',
      isPublished: false,
      viewCount: 0,
      inquiryCount: 0,
    });

    await this.incrementEntitlementUsage(entitlement);

    return listing;
  }

  async updateMarketplaceListing(
    listingId: string,
    sellerUserId: string,
    dto: UpdateMarketplaceListingDto,
  ) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing || listing.status === 'deleted') {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerOwnsListing(listing, sellerUserId, 'update');

    if (listing.status === 'approved') {
      throw new HttpException(
        'Cannot edit an approved listing. Delete it and create a new listing if details changed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.listingModel.findByIdAndUpdate(listingId, dto, { new: true });
  }

  async deleteMarketplaceListing(listingId: string, sellerUserId: string) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing || listing.status === 'deleted') {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerOwnsListing(listing, sellerUserId, 'delete');

    listing.status = 'deleted';
    listing.isPublished = false;
    await listing.save();

    return listing;
  }

  async submitMarketplaceListing(listingId: string, sellerUserId: string) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing || listing.status === 'deleted') {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertSellerOwnsListing(listing, sellerUserId, 'submit');

    if (listing.status === 'approved') {
      throw new HttpException(
        'Marketplace listing is already approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    listing.status = 'pending_approval';
    listing.isPublished = false;
    await listing.save();

    return listing;
  }

  async approveMarketplaceListing(
    actorUserId: string,
    listingId: string,
    reason?: string,
  ) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing || listing.status === 'deleted') {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (listing.status !== 'pending_approval') {
      throw new HttpException(
        'Only marketplace listings pending approval can be approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousStatus = listing.status;
    listing.status = 'approved';
    listing.isPublished = true;
    listing.publishedAt = new Date();
    listing.rejectedReason = undefined;
    await listing.save();

    await this.auditLogModel.create({
      actorUserId,
      listingId,
      action: 'approve-marketplace-listing',
      previousStatus,
      nextStatus: 'approved',
      reason,
    });

    return {
      listingId,
      previousStatus,
      status: listing.status,
      action: 'approve-marketplace-listing',
    };
  }

  async rejectMarketplaceListing(
    actorUserId: string,
    listingId: string,
    reason?: string,
  ) {
    const listing = await this.listingModel.findById(listingId);
    if (!listing || listing.status === 'deleted') {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (listing.status !== 'pending_approval') {
      throw new HttpException(
        'Only marketplace listings pending approval can be rejected',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousStatus = listing.status;
    listing.status = 'rejected';
    listing.isPublished = false;
    listing.rejectedReason = reason;
    await listing.save();

    await this.auditLogModel.create({
      actorUserId,
      listingId,
      action: 'reject-marketplace-listing',
      previousStatus,
      nextStatus: 'rejected',
      reason,
    });

    return {
      listingId,
      previousStatus,
      status: listing.status,
      action: 'reject-marketplace-listing',
    };
  }

  async searchMarketplaceListings(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { search, category, city, postCode, minPrice, maxPrice } = params;
    const whereConditions: Record<string, unknown> = {
      status: 'approved',
      isPublished: true,
      isAvailable: true,
    };

    if (search) {
      whereConditions.$or = ['title', 'description', 'category', 'city'].map(
        (field) => ({
          [field]: { $regex: search, $options: 'i' },
        }),
      );
    }
    if (category) {
      whereConditions.category = { $regex: category, $options: 'i' };
    }
    if (city) {
      whereConditions.city = { $regex: city, $options: 'i' };
    }
    if (postCode) {
      whereConditions.postCode = { $regex: postCode, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice)
        (whereConditions.price as Record<string, number>).$gte =
          Number(minPrice);
      if (maxPrice)
        (whereConditions.price as Record<string, number>).$lte =
          Number(maxPrice);
    }

    const [total, listings] = await Promise.all([
      this.listingModel.countDocuments(whereConditions),
      this.listingModel
        .find(whereConditions)
        .select(
          'title description category price currency city postCode photos viewCount inquiryCount publishedAt createdAt',
        )
        .populate('sellerUserId', 'fullName email')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: listings.map((listing: any) => this.toPublicListing(listing)),
    };
  }

  async getMarketplaceListing(listingId: string) {
    const listing = await this.listingModel
      .findOne({
        _id: listingId,
        status: 'approved',
        isPublished: true,
        isAvailable: true,
      })
      .populate('sellerUserId', 'fullName email')
      .lean();

    if (!listing) {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.listingModel.findByIdAndUpdate(listingId, {
      $inc: { viewCount: 1 },
    });

    return this.toPublicListing({
      ...(listing as any),
      viewCount: Number((listing as any).viewCount || 0) + 1,
    });
  }

  async createMarketplaceInquiry(
    listingId: string,
    dto: CreateMarketplaceInquiryDto,
    buyerUserId?: string,
  ) {
    const listing = await this.listingModel
      .findOne({
        _id: listingId,
        status: 'approved',
        isPublished: true,
        isAvailable: true,
      })
      .lean();

    if (!listing) {
      throw new HttpException(
        'Marketplace listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const inquiry = await this.inquiryModel.create({
      ...dto,
      listingId,
      buyerUserId,
      sellerUserId: (listing as any).sellerUserId,
    });

    await this.listingModel.findByIdAndUpdate(listingId, {
      $inc: { inquiryCount: 1 },
    });

    return inquiry;
  }

  async getMyMarketplaceListings(sellerUserId: string, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = { sellerUserId, status: { $ne: 'deleted' } };

    const [total, listings] = await Promise.all([
      this.listingModel.countDocuments(whereConditions),
      this.listingModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return { meta: { page, limit, total }, data: listings };
  }

  async getAdminMarketplaceListings(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { status, search, category } = params;
    const whereConditions: Record<string, unknown> = {};

    if (status) whereConditions.status = status;
    if (category)
      whereConditions.category = { $regex: category, $options: 'i' };
    if (search) {
      whereConditions.$or = ['title', 'description', 'category', 'city'].map(
        (field) => ({
          [field]: { $regex: search, $options: 'i' },
        }),
      );
    }

    const [total, listings] = await Promise.all([
      this.listingModel.countDocuments(whereConditions),
      this.listingModel
        .find(whereConditions)
        .populate('sellerUserId', 'fullName email role')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return { meta: { page, limit, total }, data: listings };
  }

  private async findUsableEntitlement(sellerUserId: string) {
    await this.entitlementModel.updateMany(
      {
        user: sellerUserId,
        status: 'active',
        endDate: { $lt: new Date() },
      },
      { status: 'expired' },
    );

    const entitlements = (await this.entitlementModel
      .find({ user: sellerUserId, status: 'active' })
      .populate('package')
      .sort({ createdAt: -1 })) as PopulatedMarketplaceEntitlement[];

    const entitlement = entitlements.find((item) => {
      const pkg = item.package;
      const usageLimit = Number(item.usageLimit || 0);
      return (
        pkg?.type === 'marketplace_listing' &&
        (usageLimit === 0 || Number(item.usageCount || 0) < usageLimit)
      );
    });

    if (!entitlement) {
      throw new HttpException(
        'Active marketplace listing entitlement required',
        HttpStatus.FORBIDDEN,
      );
    }

    return entitlement;
  }

  private async incrementEntitlementUsage(
    entitlement: PopulatedMarketplaceEntitlement,
  ) {
    const usageLimit = Number(entitlement.usageLimit || 0);
    if (usageLimit > 0 && Number(entitlement.usageCount || 0) >= usageLimit) {
      throw new HttpException(
        'Usage limit reached for this package',
        HttpStatus.BAD_REQUEST,
      );
    }

    entitlement.usageCount = Number(entitlement.usageCount || 0) + 1;
    await entitlement.save();
  }

  private assertSellerOwnsListing(
    listing: MarketplaceListingDocument,
    sellerUserId: string,
    action: string,
  ) {
    if (String(listing.sellerUserId) !== sellerUserId) {
      throw new HttpException(
        `You can only ${action} your own marketplace listings`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toPublicListing(listing: any) {
    return {
      id: listing._id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price,
      currency: listing.currency,
      city: listing.city,
      postCode: listing.postCode,
      photos: listing.photos || [],
      viewCount: Number(listing.viewCount || 0),
      inquiryCount: Number(listing.inquiryCount || 0),
      publishedAt: listing.publishedAt,
      createdAt: listing.createdAt,
      seller: listing.sellerUserId
        ? {
            id: listing.sellerUserId._id,
            name: listing.sellerUserId.fullName,
            email: listing.sellerUserId.email,
          }
        : null,
    };
  }
}

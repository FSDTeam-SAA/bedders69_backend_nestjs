import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { fileUpload } from 'src/app/helpers/fileUploder';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  Entitlement,
  EntitlementDocument,
} from '../entitlement/entities/entitlement.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import {
  AdvertisementAuditLog,
  AdvertisementAuditLogDocument,
} from './entities/advertisement-audit-log.entity';
import {
  Advertisement,
  AdvertisementDocument,
} from './entities/advertisement.entity';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

type PopulatedAdvertisementEntitlement = EntitlementDocument & {
  package?: { type?: string };
  usageCount: number;
  usageLimit: number;
  save: () => Promise<unknown>;
};

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private readonly advertisementModel: Model<AdvertisementDocument>,
    @InjectModel(AdvertisementAuditLog.name)
    private readonly auditLogModel: Model<AdvertisementAuditLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Entitlement.name)
    private readonly entitlementModel: Model<EntitlementDocument>,
  ) {}

  async createAdvertisement(
    advertiserUserId: string,
    dto: CreateAdvertisementDto,
  ) {
    await this.assertAdvertiserCanCreate(advertiserUserId);
    this.assertValidDateWindow(dto.startsAt, dto.endsAt);

    const entitlement = await this.findUsableEntitlement(advertiserUserId);
    const advertisement = await this.advertisementModel.create({
      ...dto,
      advertiserUserId,
      entitlementId: entitlement._id,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      status: 'pending_approval',
      isActive: true,
      impressionCount: 0,
      clickCount: 0,
    });

    await this.incrementEntitlementUsage(entitlement);

    return advertisement;
  }

  async uploadAdvertisementAsset(
    advertisementId: string,
    advertiserUserId: string,
    file: Express.Multer.File,
  ) {
    const advertisement =
      await this.advertisementModel.findById(advertisementId);
    if (!advertisement || advertisement.status === 'deleted') {
      throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
    }

    this.assertAdvertiserOwnsAdvertisement(
      advertisement,
      advertiserUserId,
      'upload assets for',
    );

    if (advertisement.status === 'approved') {
      throw new HttpException(
        'Cannot upload assets for an approved advertisement',
        HttpStatus.BAD_REQUEST,
      );
    }

    const uploaded = await fileUpload.uploadToCloudinary(file);
    advertisement.assetUrl = uploaded.url;
    advertisement.assetPublicId = uploaded.public_id;
    await advertisement.save();

    return advertisement;
  }

  async updateAdvertisement(
    advertisementId: string,
    advertiserUserId: string,
    dto: UpdateAdvertisementDto,
  ) {
    const advertisement =
      await this.advertisementModel.findById(advertisementId);
    if (!advertisement || advertisement.status === 'deleted') {
      throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
    }

    this.assertAdvertiserOwnsAdvertisement(
      advertisement,
      advertiserUserId,
      'update',
    );

    if (advertisement.status === 'approved') {
      throw new HttpException(
        'Cannot update an approved advertisement',
        HttpStatus.BAD_REQUEST,
      );
    }

    const startsAt = dto.startsAt ?? advertisement.startsAt.toISOString();
    const endsAt = dto.endsAt ?? advertisement.endsAt.toISOString();
    this.assertValidDateWindow(startsAt, endsAt);

    const update: Record<string, unknown> = { ...dto };
    if (dto.startsAt) update.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) update.endsAt = new Date(dto.endsAt);

    return this.advertisementModel.findByIdAndUpdate(advertisementId, update, {
      new: true,
    });
  }

  async approveAdvertisement(
    actorUserId: string,
    advertisementId: string,
    reason?: string,
  ) {
    const advertisement =
      await this.advertisementModel.findById(advertisementId);
    if (!advertisement || advertisement.status === 'deleted') {
      throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
    }

    if (advertisement.status !== 'pending_approval') {
      throw new HttpException(
        'Only advertisements pending approval can be approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousStatus = advertisement.status;
    advertisement.status = 'approved';
    advertisement.isActive = true;
    advertisement.approvedAt = new Date();
    advertisement.rejectedReason = undefined;
    await advertisement.save();

    await this.auditLogModel.create({
      actorUserId,
      advertisementId,
      action: 'approve-advertisement',
      previousStatus,
      nextStatus: 'approved',
      reason,
    });

    return {
      advertisementId,
      previousStatus,
      status: advertisement.status,
      action: 'approve-advertisement',
    };
  }

  async rejectAdvertisement(
    actorUserId: string,
    advertisementId: string,
    reason?: string,
  ) {
    const advertisement =
      await this.advertisementModel.findById(advertisementId);
    if (!advertisement || advertisement.status === 'deleted') {
      throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
    }

    if (advertisement.status !== 'pending_approval') {
      throw new HttpException(
        'Only advertisements pending approval can be rejected',
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousStatus = advertisement.status;
    advertisement.status = 'rejected';
    advertisement.isActive = false;
    advertisement.rejectedReason = reason;
    await advertisement.save();

    await this.auditLogModel.create({
      actorUserId,
      advertisementId,
      action: 'reject-advertisement',
      previousStatus,
      nextStatus: 'rejected',
      reason,
    });

    return {
      advertisementId,
      previousStatus,
      status: advertisement.status,
      action: 'reject-advertisement',
    };
  }

  async serveAdvertisements(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { placement } = params;
    const now = new Date();
    const whereConditions: Record<string, unknown> = {
      status: 'approved',
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    };

    if (placement) whereConditions.placement = placement;

    const [total, advertisements] = await Promise.all([
      this.advertisementModel.countDocuments(whereConditions),
      this.advertisementModel
        .find(whereConditions)
        .select(
          'title description placement targetUrl assetUrl startsAt endsAt impressionCount clickCount',
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return {
      meta: { page, limit, total },
      data: advertisements.map((advertisement: any) =>
        this.toPublicAdvertisement(advertisement),
      ),
    };
  }

  async trackAdvertisementImpression(advertisementId: string) {
    const advertisement = await this.advertisementModel.findOneAndUpdate(
      this.getServableAdvertisementQuery(advertisementId),
      { $inc: { impressionCount: 1 } },
      { new: true },
    );

    if (!advertisement) {
      throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
    }

    return {
      advertisementId,
      impressionCount: advertisement.impressionCount,
    };
  }

  async trackAdvertisementClick(advertisementId: string) {
    const advertisement = await this.advertisementModel.findOneAndUpdate(
      this.getServableAdvertisementQuery(advertisementId),
      { $inc: { clickCount: 1 } },
      { new: true },
    );

    if (!advertisement) {
      throw new HttpException('Advertisement not found', HttpStatus.NOT_FOUND);
    }

    return {
      advertisementId,
      clickCount: advertisement.clickCount,
      targetUrl: advertisement.targetUrl,
    };
  }

  async getMyAdvertisements(advertiserUserId: string, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = {
      advertiserUserId,
      status: { $ne: 'deleted' },
    };

    const [total, advertisements] = await Promise.all([
      this.advertisementModel.countDocuments(whereConditions),
      this.advertisementModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return { meta: { page, limit, total }, data: advertisements };
  }

  async getAdminAdvertisements(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { status, placement, search } = params;
    const whereConditions: Record<string, unknown> = {};

    if (status) whereConditions.status = status;
    if (placement) whereConditions.placement = placement;
    if (search) {
      whereConditions.$or = ['title', 'description'].map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }

    const [total, advertisements] = await Promise.all([
      this.advertisementModel.countDocuments(whereConditions),
      this.advertisementModel
        .find(whereConditions)
        .populate('advertiserUserId', 'fullName email role')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return { meta: { page, limit, total }, data: advertisements };
  }

  private async assertAdvertiserCanCreate(advertiserUserId: string) {
    const user = await this.userModel.findById(advertiserUserId).lean();
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
        'Only organizations can create advertisements',
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.status !== 'active') {
      throw new HttpException(
        'Your account must be active to create advertisements',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async findUsableEntitlement(advertiserUserId: string) {
    await this.entitlementModel.updateMany(
      {
        user: advertiserUserId,
        status: 'active',
        endDate: { $lt: new Date() },
      },
      { status: 'expired' },
    );

    const entitlements = (await this.entitlementModel
      .find({ user: advertiserUserId, status: 'active' })
      .populate('package')
      .sort({ createdAt: -1 })) as PopulatedAdvertisementEntitlement[];

    const entitlement = entitlements.find((item) => {
      const usageLimit = Number(item.usageLimit || 0);
      return (
        item.package?.type === 'advertisement' &&
        (usageLimit === 0 || Number(item.usageCount || 0) < usageLimit)
      );
    });

    if (!entitlement) {
      throw new HttpException(
        'Active advertisement entitlement required',
        HttpStatus.FORBIDDEN,
      );
    }

    return entitlement;
  }

  private async incrementEntitlementUsage(
    entitlement: PopulatedAdvertisementEntitlement,
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

  private assertValidDateWindow(startsAt: string, endsAt: string) {
    if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      throw new HttpException(
        'Advertisement end date must be after start date',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertAdvertiserOwnsAdvertisement(
    advertisement: AdvertisementDocument,
    advertiserUserId: string,
    action: string,
  ) {
    if (String(advertisement.advertiserUserId) !== advertiserUserId) {
      throw new HttpException(
        `You can only ${action} your own advertisements`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private getServableAdvertisementQuery(advertisementId: string) {
    const now = new Date();
    return {
      _id: advertisementId,
      status: 'approved',
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    };
  }

  private toPublicAdvertisement(advertisement: any) {
    return {
      id: advertisement._id,
      title: advertisement.title,
      description: advertisement.description,
      placement: advertisement.placement,
      targetUrl: advertisement.targetUrl,
      assetUrl: advertisement.assetUrl,
      startsAt: advertisement.startsAt,
      endsAt: advertisement.endsAt,
      impressionCount: Number(advertisement.impressionCount || 0),
      clickCount: Number(advertisement.clickCount || 0),
    };
  }
}

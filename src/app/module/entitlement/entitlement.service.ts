import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Entitlement,
  EntitlementDocument,
} from './entities/entitlement.entity';
import { Package, PackageDocument } from '../package/entities/package.entity';

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    @InjectModel(Entitlement.name)
    private readonly entitlementModel: Model<EntitlementDocument>,
    @InjectModel(Package.name)
    private readonly packageModel: Model<PackageDocument>,
  ) {}

  async activateEntitlement(
    userId: string,
    packageId: string,
    paymentId: string,
  ) {
    const pkg = await this.packageModel.findById(packageId);
    if (!pkg) {
      this.logger.warn(
        `Package ${packageId} not found during entitlement activation`,
      );
      return null;
    }

    const existing = await this.entitlementModel.findOne({
      user: userId,
      package: packageId,
      status: 'active',
    });
    if (existing) {
      this.logger.log(
        `Entitlement already active for user ${userId} on package ${packageId}`,
      );
      return existing;
    }

    const now = new Date();
    const endDate = new Date(
      now.getTime() + (pkg.durationDays || 30) * 24 * 60 * 60 * 1000,
    );

    return this.entitlementModel.create({
      user: userId,
      package: packageId,
      payment: paymentId,
      status: 'active',
      startDate: now,
      endDate,
      usageCount: 0,
      usageLimit: pkg.usageLimit || 0,
    });
  }

  async getMyEntitlements(userId: string) {
    await this.expireStaleEntitlements(userId);

    return this.entitlementModel
      .find({ user: userId })
      .populate('package')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getActiveEntitlements(userId: string) {
    await this.expireStaleEntitlements(userId);

    return this.entitlementModel
      .find({ user: userId, status: 'active' })
      .populate('package')
      .sort({ createdAt: -1 })
      .lean();
  }

  async hasActiveEntitlement(userId: string, packageType: string) {
    await this.expireStaleEntitlements(userId);

    const entitlement = await this.entitlementModel
      .findOne({
        user: userId,
        status: 'active',
      })
      .populate('package');

    if (!entitlement) return false;

    const pkg = entitlement.package as unknown as { type?: string };
    return pkg?.type === packageType;
  }

  async assertEntitlement(userId: string, packageType: string) {
    const hasEntitlement = await this.hasActiveEntitlement(userId, packageType);
    if (!hasEntitlement) {
      throw new HttpException(
        `Active ${package_type_to_label(packageType)} entitlement required`,
        403,
      );
    }
  }

  async incrementUsage(entitlementId: string) {
    const entitlement = await this.entitlementModel.findById(entitlementId);
    if (!entitlement) return null;

    if (
      entitlement.usageLimit > 0 &&
      entitlement.usageCount >= entitlement.usageLimit
    ) {
      throw new HttpException('Usage limit reached for this package', 400);
    }

    entitlement.usageCount += 1;
    await entitlement.save();
    return entitlement;
  }

  async checkUsageLimit(entitlementId: string): Promise<boolean> {
    const entitlement = await this.entitlementModel.findById(entitlementId);
    if (!entitlement) return false;
    if (entitlement.status !== 'active') return false;
    if (entitlement.usageLimit === 0) return true;
    return entitlement.usageCount < entitlement.usageLimit;
  }

  private async expireStaleEntitlements(userId: string) {
    await this.entitlementModel.updateMany(
      {
        user: userId,
        status: 'active',
        endDate: { $lt: new Date() },
      },
      { status: 'expired' },
    );
  }
}

function package_type_to_label(type: string): string {
  const labels: Record<string, string> = {
    membership: 'membership',
    job_posting: 'job posting',
    marketplace_listing: 'marketplace listing',
    advertisement: 'advertisement',
    premium_profile: 'premium profile',
  };
  return labels[type] || type;
}

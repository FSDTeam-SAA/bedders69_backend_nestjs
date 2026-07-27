import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Payment, PaymentSchema } from '../payment/entities/payment.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { JobListing, JobListingSchema } from './entities/job-listing.entity';
import { Marketplace, MarketplaceSchema } from './entities/marketplace.entity';
import { Coupon, CouponSchema } from './entities/coupon.entity';
import {
  Subscribe,
  SubscribeSchema,
} from '../subscribe/entities/subscribe.entity';
import { Family, FamilySchema } from '../family/entities/family.entity';
import { Care, CareSchema } from '../care/entities/care.entity';
import {
  OrganizationProfile,
  OrganizationProfileSchema,
} from '../profile/entities/organization-profile.entity';
import { Job, JobSchema } from '../job/entities/job.entity';
import {
  JobApplication,
  JobApplicationSchema,
} from '../job-application/entities/job-application.entity';
import {
  MarketplaceListing,
  MarketplaceListingSchema,
} from '../marketplace/entities/marketplace-listing.entity';
import {
  MarketplaceInquiry,
  MarketplaceInquirySchema,
} from '../marketplace/entities/marketplace-inquiry.entity';
import {
  Advertisement,
  AdvertisementSchema,
} from '../advertisement/entities/advertisement.entity';
import {
  NotificationLog,
  NotificationLogSchema,
} from '../notification/entities/notification-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Company.name, schema: CompanySchema },
      { name: JobListing.name, schema: JobListingSchema },
      { name: Marketplace.name, schema: MarketplaceSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Subscribe.name, schema: SubscribeSchema },
      { name: Family.name, schema: FamilySchema },
      { name: Care.name, schema: CareSchema },
      { name: OrganizationProfile.name, schema: OrganizationProfileSchema },
      { name: Job.name, schema: JobSchema },
      { name: JobApplication.name, schema: JobApplicationSchema },
      { name: MarketplaceListing.name, schema: MarketplaceListingSchema },
      { name: MarketplaceInquiry.name, schema: MarketplaceInquirySchema },
      { name: Advertisement.name, schema: AdvertisementSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

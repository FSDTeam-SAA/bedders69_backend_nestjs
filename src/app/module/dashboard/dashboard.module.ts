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
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

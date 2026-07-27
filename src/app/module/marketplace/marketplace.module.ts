import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Entitlement,
  EntitlementSchema,
} from '../entitlement/entities/entitlement.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  MarketplaceAuditLog,
  MarketplaceAuditLogSchema,
} from './entities/marketplace-audit-log.entity';
import {
  MarketplaceInquiry,
  MarketplaceInquirySchema,
} from './entities/marketplace-inquiry.entity';
import {
  MarketplaceListing,
  MarketplaceListingSchema,
} from './entities/marketplace-listing.entity';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: MarketplaceListing.name, schema: MarketplaceListingSchema },
      { name: MarketplaceInquiry.name, schema: MarketplaceInquirySchema },
      { name: MarketplaceAuditLog.name, schema: MarketplaceAuditLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService, MongooseModule],
})
export class MarketplaceModule {}

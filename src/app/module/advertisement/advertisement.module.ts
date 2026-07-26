import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Entitlement,
  EntitlementSchema,
} from '../entitlement/entities/entitlement.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { AdvertisementController } from './advertisement.controller';
import { AdvertisementService } from './advertisement.service';
import {
  AdvertisementAuditLog,
  AdvertisementAuditLogSchema,
} from './entities/advertisement-audit-log.entity';
import {
  Advertisement,
  AdvertisementSchema,
} from './entities/advertisement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Advertisement.name, schema: AdvertisementSchema },
      { name: AdvertisementAuditLog.name, schema: AdvertisementAuditLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
    ]),
  ],
  controllers: [AdvertisementController],
  providers: [AdvertisementService],
  exports: [AdvertisementService, MongooseModule],
})
export class AdvertisementModule {}

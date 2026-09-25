import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Care, CareSchema } from '../care/entities/care.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { Family, FamilySchema } from '../family/entities/family.entity';
import { Payment, PaymentSchema } from '../payment/entities/payment.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  OrganizationProfile,
  OrganizationProfileSchema,
} from './entities/organization-profile.entity';
import {
  ProfileAuditLog,
  ProfileAuditLogSchema,
} from './entities/profile-audit-log.entity';
import { Agency, AgencySchema } from '../agency/entities/agency.entity';
import {
  ProductSupplier,
  ProductSupplierSchema,
} from '../product-supplier/entities/product-supplier.entity';
import {
  ServiceProvider,
  ServiceProviderSchema,
} from '../service-provider/entities/service-provider.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import {
  Entitlement,
  EntitlementSchema,
} from '../entitlement/entities/entitlement.entity';
import { Package, PackageSchema } from '../package/entities/package.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OrganizationProfile.name, schema: OrganizationProfileSchema },
      { name: ProfileAuditLog.name, schema: ProfileAuditLogSchema },
      { name: Family.name, schema: FamilySchema },
      { name: Company.name, schema: CompanySchema },
      { name: Care.name, schema: CareSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: ProductSupplier.name, schema: ProductSupplierSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Entitlement.name, schema: EntitlementSchema },
      { name: Package.name, schema: PackageSchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Agency, AgencySchema } from '../agency/entities/agency.entity';
import { Care, CareSchema } from '../care/entities/care.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { Family, FamilySchema } from '../family/entities/family.entity';
import {
  ProductSupplier,
  ProductSupplierSchema,
} from '../product-supplier/entities/product-supplier.entity';
import {
  ServiceProvider,
  ServiceProviderSchema,
} from '../service-provider/entities/service-provider.entity';
import { User, UserSchema } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Family.name, schema: FamilySchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Care.name, schema: CareSchema },
      { name: Company.name, schema: CompanySchema },
      { name: ProductSupplier.name, schema: ProductSupplierSchema },
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

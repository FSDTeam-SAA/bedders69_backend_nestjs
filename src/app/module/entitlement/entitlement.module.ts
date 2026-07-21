import { Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { EntitlementController } from './entitlement.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Entitlement, EntitlementSchema } from './entities/entitlement.entity';
import { Package, PackageSchema } from '../package/entities/package.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entitlement.name, schema: EntitlementSchema },
      { name: Package.name, schema: PackageSchema },
    ]),
  ],
  controllers: [EntitlementController],
  providers: [EntitlementService],
  exports: [EntitlementService, MongooseModule],
})
export class EntitlementModule {}

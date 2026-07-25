import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  ProductSupplier,
  ProductSupplierSchema,
} from './entities/product-supplier.entity';
import { ProductSupplierController } from './product-supplier.controller';
import { ProductSupplierService } from './product-supplier.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductSupplier.name, schema: ProductSupplierSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProductSupplierController],
  providers: [ProductSupplierService],
})
export class ProductSupplierModule {}

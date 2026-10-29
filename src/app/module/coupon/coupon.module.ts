import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon, CouponSchema } from './entities/coupon.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService, MongooseModule],
})
export class CouponModule {}

import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon, CouponDocument } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const existingCoupon = await this.couponModel.findOne({
      couponCode: createCouponDto.couponCode.toUpperCase(),
    });

    if (existingCoupon) {
      throw new HttpException('Coupon code already exists', 400);
    }

    return this.couponModel.create({
      ...createCouponDto,
      couponCode: createCouponDto.couponCode.toUpperCase(),
    });
  }

  async findAll() {
    return this.couponModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const payload = updateCouponDto.couponCode
      ? {
          ...updateCouponDto,
          couponCode: updateCouponDto.couponCode.toUpperCase(),
        }
      : updateCouponDto;

    const result = await this.couponModel.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (!result) {
      throw new HttpException('Coupon not found', 404);
    }

    return result;
  }

  async remove(id: string) {
    const result = await this.couponModel.findByIdAndDelete(id);

    if (!result) {
      throw new HttpException('Coupon not found', 404);
    }

    return result;
  }
}

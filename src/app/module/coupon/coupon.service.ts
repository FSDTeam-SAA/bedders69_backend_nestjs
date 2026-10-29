import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { Coupon, CouponAppliesTo, CouponDocument } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    const couponCode = createCouponDto.couponCode.trim().toUpperCase();
    const existingCoupon = await this.couponModel.findOne({ couponCode });

    if (existingCoupon) {
      throw new HttpException('Coupon code already exists', HttpStatus.BAD_REQUEST);
    }

    return this.couponModel.create({
      ...createCouponDto,
      couponCode,
      appliesTo: createCouponDto.appliesTo || CouponAppliesTo.ALL,
    });
  }

  async findAll() {
    const coupons = await this.couponModel.find().sort({ createdAt: -1 });
    return coupons.map((coupon) => {
      const obj = coupon.toObject();
      return {
        ...obj,
        appliesTo: obj.appliesTo || CouponAppliesTo.ALL,
      };
    });
  }

  async findOne(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    }
    const obj = coupon.toObject();
    return {
      ...obj,
      appliesTo: obj.appliesTo || CouponAppliesTo.ALL,
    };
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const payload = updateCouponDto.couponCode
      ? {
          ...updateCouponDto,
          couponCode: updateCouponDto.couponCode.trim().toUpperCase(),
        }
      : updateCouponDto;

    const result = await this.couponModel.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (!result) {
      throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    }

    const obj = result.toObject();
    return {
      ...obj,
      appliesTo: obj.appliesTo || CouponAppliesTo.ALL,
    };
  }

  async remove(id: string) {
    const result = await this.couponModel.findByIdAndDelete(id);

    if (!result) {
      throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const couponCode = (dto.couponCode || '').trim().toUpperCase();
    if (!couponCode) {
      throw new HttpException('Coupon code is required', HttpStatus.BAD_REQUEST);
    }

    const coupon = await this.couponModel.findOne({ couponCode });
    if (!coupon) {
      throw new HttpException('Coupon code not found', HttpStatus.NOT_FOUND);
    }

    const now = new Date();

    // Check Start Date
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      throw new HttpException('This coupon is not active yet', HttpStatus.BAD_REQUEST);
    }

    // Check Expiration Date
    if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
      throw new HttpException('This coupon has expired', HttpStatus.BAD_REQUEST);
    }

    // Check Total Usage Limit
    if (
      coupon.totalUsageLimit !== undefined &&
      coupon.totalUsageLimit !== null &&
      Number(coupon.usedCount || 0) >= Number(coupon.totalUsageLimit)
    ) {
      throw new HttpException('This coupon usage limit has been reached', HttpStatus.BAD_REQUEST);
    }

    // Check Minimum Purchase Requirement if set
    const productAmount = Number(dto.productAmount ?? (dto.category === CouponAppliesTo.PRODUCT ? (dto.amount ?? 0) : 0));
    const deliveryFee = Number(dto.deliveryFee ?? (dto.category === CouponAppliesTo.DELIVERY ? (dto.amount ?? 0) : 0));
    const totalPurchase = (dto.productAmount !== undefined || dto.deliveryFee !== undefined)
      ? (productAmount + deliveryFee)
      : Number(dto.amount ?? 0);

    if (coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0 && totalPurchase < coupon.minPurchaseAmount) {
      throw new HttpException(
        `Minimum purchase of £${coupon.minPurchaseAmount.toFixed(2)} required for this coupon`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Category Matching
    const couponAppliesTo = coupon.appliesTo || CouponAppliesTo.ALL;
    const requestedCategory = dto.category;

    if (requestedCategory) {
      if (requestedCategory === CouponAppliesTo.SUBSCRIPTION) {
        if (couponAppliesTo !== CouponAppliesTo.ALL && couponAppliesTo !== CouponAppliesTo.SUBSCRIPTION) {
          throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
        }
      } else if (requestedCategory === CouponAppliesTo.PRODUCT) {
        if (couponAppliesTo !== CouponAppliesTo.ALL && couponAppliesTo !== CouponAppliesTo.PRODUCT) {
          throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
        }
      } else if (requestedCategory === CouponAppliesTo.DELIVERY) {
        if (couponAppliesTo !== CouponAppliesTo.ALL && couponAppliesTo !== CouponAppliesTo.DELIVERY) {
          throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
        }
      }
    } else {
      // If no explicit category passed, check context from amounts
      if (couponAppliesTo === CouponAppliesTo.SUBSCRIPTION) {
        throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
      }
      if (couponAppliesTo === CouponAppliesTo.DELIVERY && deliveryFee <= 0) {
        throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
      }
    }

    // Calculate Discount
    const discountPercent = Number(coupon.discountValue || 0);
    let productDiscount = 0;
    let deliveryDiscount = 0;
    let totalDiscount = 0;

    if (requestedCategory === CouponAppliesTo.SUBSCRIPTION || couponAppliesTo === CouponAppliesTo.SUBSCRIPTION) {
      const baseAmount = Number(dto.amount ?? totalPurchase);
      totalDiscount = Math.round((baseAmount * discountPercent) / 100 * 100) / 100;
      totalDiscount = Math.min(baseAmount, totalDiscount);
    } else if (couponAppliesTo === CouponAppliesTo.DELIVERY) {
      // DELIVERY Coupon: strictly discounts only delivery fee
      if (deliveryFee <= 0) {
        throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
      }
      deliveryDiscount = Math.round((deliveryFee * discountPercent) / 100 * 100) / 100;
      deliveryDiscount = Math.min(deliveryFee, deliveryDiscount);
      totalDiscount = deliveryDiscount;
    } else if (couponAppliesTo === CouponAppliesTo.PRODUCT) {
      // PRODUCT Coupon: strictly discounts only product amount
      const baseProduct = productAmount > 0 ? productAmount : totalPurchase;
      if (baseProduct <= 0) {
        throw new HttpException('This coupon is not valid for this item.', HttpStatus.BAD_REQUEST);
      }
      productDiscount = Math.round((baseProduct * discountPercent) / 100 * 100) / 100;
      productDiscount = Math.min(baseProduct, productDiscount);
      totalDiscount = productDiscount;
    } else {
      // ALL Coupon: discounts both product and delivery
      if (productAmount > 0 || deliveryFee > 0) {
        productDiscount = Math.round((productAmount * discountPercent) / 100 * 100) / 100;
        productDiscount = Math.min(productAmount, productDiscount);
        deliveryDiscount = Math.round((deliveryFee * discountPercent) / 100 * 100) / 100;
        deliveryDiscount = Math.min(deliveryFee, deliveryDiscount);
        totalDiscount = Math.round((productDiscount + deliveryDiscount) * 100) / 100;
      } else {
        totalDiscount = Math.round((totalPurchase * discountPercent) / 100 * 100) / 100;
        totalDiscount = Math.min(totalPurchase, totalDiscount);
      }
    }

    const finalProductAmount = Math.max(0, Math.round((productAmount - productDiscount) * 100) / 100);
    const finalDeliveryFee = Math.max(0, Math.round((deliveryFee - deliveryDiscount) * 100) / 100);
    const finalTotal = (productAmount > 0 || deliveryFee > 0)
      ? Math.max(0, Math.round((finalProductAmount + finalDeliveryFee) * 100) / 100)
      : Math.max(0, Math.round((totalPurchase - totalDiscount) * 100) / 100);

    return {
      couponId: coupon._id,
      couponName: coupon.couponName,
      couponCode: coupon.couponCode,
      description: coupon.description,
      appliesTo: couponAppliesTo,
      discountValue: discountPercent,
      productDiscount,
      deliveryDiscount,
      totalDiscount,
      originalProductAmount: productAmount,
      originalDeliveryFee: deliveryFee,
      originalTotal: totalPurchase,
      finalProductAmount,
      finalDeliveryFee,
      finalTotal,
    };
  }

  async recordUsage(couponCode: string) {
    const code = (couponCode || '').trim().toUpperCase();
    if (!code) return null;
    return this.couponModel.findOneAndUpdate(
      { couponCode: code },
      { $inc: { usedCount: 1 } },
      { new: true },
    );
  }
}

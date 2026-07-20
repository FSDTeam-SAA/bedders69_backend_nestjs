import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

export enum CouponValidity {
  ALL_USERS = 'ALL_USERS',
  FIRST_TIME_USERS = 'FIRST_TIME_USERS',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, trim: true })
  couponName!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  couponCode!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true })
  discountValue!: number;

  @Prop({ required: true })
  totalUsageLimit!: number;

  @Prop({ default: 0 })
  usedCount!: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  expiryDate!: Date;

  @Prop({
    enum: CouponValidity,
    default: CouponValidity.ALL_USERS,
  })
  validitySettings!: CouponValidity;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

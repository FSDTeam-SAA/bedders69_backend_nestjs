import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, trim: true })
  couponName!: string;

  @Prop({ required: true, trim: true, unique: true, uppercase: true })
  couponCode!: string;

  @Prop()
  description!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  discountValue!: number;

  @Prop({ default: false })
  allUsers!: boolean;

  @Prop({ default: false })
  firstTime!: boolean;

  @Prop({ required: true })
  totalUsageLimit!: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  expiryDate!: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

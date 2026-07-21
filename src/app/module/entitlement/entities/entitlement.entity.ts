import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import mongoose from 'mongoose';

export type EntitlementDocument = HydratedDocument<Entitlement>;

export const ENTITLEMENT_STATUSES = ['active', 'expired', 'cancelled'] as const;

export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

@Schema({ timestamps: true })
export class Entitlement {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true,
  })
  package!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  })
  payment!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ENTITLEMENT_STATUSES,
    default: 'active',
  })
  status!: EntitlementStatus;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ default: 0 })
  usageCount!: number;

  @Prop({ default: 0 })
  usageLimit!: number;
}

export const EntitlementSchema = SchemaFactory.createForClass(Entitlement);

EntitlementSchema.index({ user: 1, package: 1, status: 1 });
EntitlementSchema.index({ user: 1, status: 1 });

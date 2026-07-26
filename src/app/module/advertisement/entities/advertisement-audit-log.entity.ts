import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdvertisementAuditLogDocument =
  HydratedDocument<AdvertisementAuditLog>;

export const ADVERTISEMENT_AUDIT_ACTIONS = [
  'approve-advertisement',
  'reject-advertisement',
] as const;

export type AdvertisementAuditAction =
  (typeof ADVERTISEMENT_AUDIT_ACTIONS)[number];

@Schema({ timestamps: true })
export class AdvertisementAuditLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actorUserId!: Types.ObjectId | string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true,
  })
  advertisementId!: Types.ObjectId | string;

  @Prop({ type: String, enum: ADVERTISEMENT_AUDIT_ACTIONS, required: true })
  action!: AdvertisementAuditAction;

  @Prop()
  previousStatus?: string;

  @Prop({ required: true })
  nextStatus!: string;

  @Prop()
  reason?: string;
}

export const AdvertisementAuditLogSchema = SchemaFactory.createForClass(
  AdvertisementAuditLog,
);

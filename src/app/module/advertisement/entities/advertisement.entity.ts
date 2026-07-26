import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdvertisementDocument = HydratedDocument<Advertisement>;

export const ADVERTISEMENT_STATUSES = [
  'pending_approval',
  'approved',
  'rejected',
  'deleted',
] as const;

export type AdvertisementStatus = (typeof ADVERTISEMENT_STATUSES)[number];

export const ADVERTISEMENT_PLACEMENTS = [
  'home_hero',
  'directory_sidebar',
  'job_search_top',
  'marketplace_top',
  'footer_banner',
] as const;

export type AdvertisementPlacement = (typeof ADVERTISEMENT_PLACEMENTS)[number];

@Schema({ timestamps: true })
export class Advertisement {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  advertiserUserId!: Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, enum: ADVERTISEMENT_PLACEMENTS, required: true })
  placement!: AdvertisementPlacement;

  @Prop({ trim: true })
  targetUrl?: string;

  @Prop({ trim: true })
  assetUrl?: string;

  @Prop({ trim: true })
  assetPublicId?: string;

  @Prop({ required: true })
  startsAt!: Date;

  @Prop({ required: true })
  endsAt!: Date;

  @Prop({
    type: String,
    enum: ADVERTISEMENT_STATUSES,
    default: 'pending_approval',
  })
  status!: AdvertisementStatus;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  impressionCount!: number;

  @Prop({ default: 0 })
  clickCount!: number;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedReason?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Entitlement' })
  entitlementId?: Types.ObjectId | string;
}

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);

AdvertisementSchema.index({ advertiserUserId: 1 });
AdvertisementSchema.index({ placement: 1, status: 1, isActive: 1 });
AdvertisementSchema.index({ startsAt: 1, endsAt: 1 });

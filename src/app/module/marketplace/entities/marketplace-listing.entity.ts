import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MarketplaceListingDocument = HydratedDocument<MarketplaceListing>;

export const MARKETPLACE_LISTING_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'deleted',
] as const;

export type MarketplaceListingStatus =
  (typeof MARKETPLACE_LISTING_STATUSES)[number];

@Schema({ timestamps: true })
export class MarketplaceListing {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sellerUserId!: Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ min: 0 })
  price?: number;

  @Prop({ default: 'GBP' })
  currency?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  postCode?: string;

  @Prop({ type: [String], default: [] })
  photos!: string[];

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ type: String, enum: MARKETPLACE_LISTING_STATUSES, default: 'draft' })
  status!: MarketplaceListingStatus;

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ default: 0 })
  viewCount!: number;

  @Prop({ default: 0 })
  inquiryCount!: number;

  @Prop()
  publishedAt?: Date;

  @Prop()
  rejectedReason?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Entitlement' })
  entitlementId?: Types.ObjectId | string;
}

export const MarketplaceListingSchema =
  SchemaFactory.createForClass(MarketplaceListing);

MarketplaceListingSchema.index({ sellerUserId: 1 });
MarketplaceListingSchema.index({ status: 1, isPublished: 1 });
MarketplaceListingSchema.index({ category: 1 });
MarketplaceListingSchema.index({ city: 1 });
MarketplaceListingSchema.index({ postCode: 1 });

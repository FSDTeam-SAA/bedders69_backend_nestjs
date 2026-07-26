import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MarketplaceInquiryDocument = HydratedDocument<MarketplaceInquiry>;

@Schema({ timestamps: true })
export class MarketplaceInquiry {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceListing',
    required: true,
  })
  listingId!: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  buyerUserId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sellerUserId!: Types.ObjectId | string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true, trim: true })
  message!: string;
}

export const MarketplaceInquirySchema =
  SchemaFactory.createForClass(MarketplaceInquiry);

MarketplaceInquirySchema.index({ listingId: 1 });
MarketplaceInquirySchema.index({ sellerUserId: 1 });

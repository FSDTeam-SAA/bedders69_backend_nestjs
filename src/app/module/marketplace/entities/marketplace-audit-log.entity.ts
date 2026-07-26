import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MarketplaceAuditLogDocument = HydratedDocument<MarketplaceAuditLog>;

export const MARKETPLACE_AUDIT_ACTIONS = [
  'approve-marketplace-listing',
  'reject-marketplace-listing',
] as const;

export type MarketplaceAuditAction = (typeof MARKETPLACE_AUDIT_ACTIONS)[number];

@Schema({ timestamps: true })
export class MarketplaceAuditLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actorUserId!: Types.ObjectId | string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceListing',
    required: true,
  })
  listingId!: Types.ObjectId | string;

  @Prop({ type: String, enum: MARKETPLACE_AUDIT_ACTIONS, required: true })
  action!: MarketplaceAuditAction;

  @Prop()
  previousStatus?: string;

  @Prop({ required: true })
  nextStatus!: string;

  @Prop()
  reason?: string;
}

export const MarketplaceAuditLogSchema =
  SchemaFactory.createForClass(MarketplaceAuditLog);

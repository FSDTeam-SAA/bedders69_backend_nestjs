import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProfileAuditLogDocument = HydratedDocument<ProfileAuditLog>;

export const PROFILE_AUDIT_ACTIONS = [
  'approve-profile',
  'reject-profile',
  'suspend-profile',
  'reactivate-profile',
] as const;

export type ProfileAuditAction = (typeof PROFILE_AUDIT_ACTIONS)[number];

@Schema({ timestamps: true })
export class ProfileAuditLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actorUserId!: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  targetUserId!: Types.ObjectId | string;

  @Prop({ required: true })
  targetRole!: string;

  @Prop({ type: String, enum: PROFILE_AUDIT_ACTIONS, required: true })
  action!: ProfileAuditAction;

  @Prop()
  previousStatus?: string;

  @Prop({ required: true })
  nextStatus!: string;

  @Prop()
  reason?: string;
}

export const ProfileAuditLogSchema =
  SchemaFactory.createForClass(ProfileAuditLog);

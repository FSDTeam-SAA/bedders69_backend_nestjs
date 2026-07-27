import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

export const NOTIFICATION_EVENTS = [
  'profile_approved',
  'profile_rejected',
  'payment_succeeded',
  'payment_failed',
  'job_application_created',
  'marketplace_inquiry_created',
  'advertisement_approved',
  'advertisement_rejected',
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export const NOTIFICATION_CHANNELS = ['email'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = [
  'pending',
  'sent',
  'failed',
  'skipped',
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

@Schema({ timestamps: true })
export class NotificationLog {
  @Prop({ type: String, enum: NOTIFICATION_EVENTS, required: true })
  event!: NotificationEvent;

  @Prop({ type: String, enum: NOTIFICATION_CHANNELS, default: 'email' })
  channel!: NotificationChannel;

  @Prop({ type: String, enum: NOTIFICATION_STATUSES, default: 'pending' })
  status!: NotificationStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  recipientUserId?: Types.ObjectId | string;

  @Prop({ required: true, trim: true, lowercase: true })
  recipientEmail!: string;

  @Prop({ trim: true })
  recipientName?: string;

  @Prop({ required: true, trim: true })
  subject!: string;

  @Prop({ required: true })
  html!: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  @Prop()
  sentAt?: Date;

  @Prop()
  errorMessage?: string;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);

NotificationLogSchema.index({ event: 1, createdAt: -1 });
NotificationLogSchema.index({ recipientUserId: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1, createdAt: -1 });

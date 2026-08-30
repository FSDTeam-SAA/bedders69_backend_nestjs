import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ContactRequestDocument = HydratedDocument<ContactRequest>;

export const CONTACT_REQUEST_STATUSES = [
  'Pending',
  'Accepted',
  'Rejected',
] as const;

export type ContactRequestStatus = (typeof CONTACT_REQUEST_STATUSES)[number];

@Schema({ timestamps: true })
export class ContactRequest {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 'MT' })
  initials!: string;

  @Prop({ default: 'bg-cyan-600' })
  avatarBg!: string;

  @Prop({ default: 'Family' })
  category!: string;

  @Prop({
    type: String,
    enum: CONTACT_REQUEST_STATUSES,
    default: 'Pending',
  })
  status!: ContactRequestStatus;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ default: 'Today 11:30' })
  time!: string;

  @Prop({ default: '07700 900 123' })
  phone!: string;
}

export const ContactRequestSchema =
  SchemaFactory.createForClass(ContactRequest);

ContactRequestSchema.index({ userId: 1 });
ContactRequestSchema.index({ userId: 1, status: 1 });

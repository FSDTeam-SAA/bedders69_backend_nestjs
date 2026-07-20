import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../user/entities/user.entity';

export type OrganizationProfileDocument = HydratedDocument<OrganizationProfile>;

export const ORGANIZATION_PROFILE_TYPES = [
  'agency',
  'supplier',
  'service_provider',
] as const;

export const PROFILE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'suspended',
] as const;

export const PROFILE_COMPLETION_STATUSES = ['incomplete', 'complete'] as const;

export type OrganizationProfileType =
  (typeof ORGANIZATION_PROFILE_TYPES)[number];
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];
export type ProfileCompletionStatus =
  (typeof PROFILE_COMPLETION_STATUSES)[number];

@Schema({ timestamps: true })
export class OrganizationProfile {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: ORGANIZATION_PROFILE_TYPES, required: true })
  profileType!: OrganizationProfileType;

  @Prop({ required: true, trim: true })
  organizationName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ trim: true })
  phoneNumber?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  postCode?: string;

  @Prop({ trim: true })
  websiteLink?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  services?: string[];

  @Prop({ type: [String], default: [] })
  documents?: string[];

  @Prop({ type: String, enum: PROFILE_STATUSES, default: 'pending' })
  status!: ProfileStatus;

  @Prop({
    type: String,
    enum: PROFILE_COMPLETION_STATUSES,
    default: 'incomplete',
  })
  profileCompletionStatus!: ProfileCompletionStatus;

  @Prop({ default: 0 })
  profileCompletionPercentage!: number;

  role!: UserRole;
}

export const OrganizationProfileSchema =
  SchemaFactory.createForClass(OrganizationProfile);

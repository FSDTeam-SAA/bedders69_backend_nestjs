import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PackageDocument = HydratedDocument<Package>;

export const PACKAGE_TYPES = [
  'membership',
  'job_posting',
  'marketplace_listing',
  'advertisement',
  'premium_profile',
] as const;

export type PackageType = (typeof PACKAGE_TYPES)[number];

@Schema({ timestamps: true })
export class Package {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, enum: PACKAGE_TYPES, required: true })
  type!: PackageType;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: [String], default: [] })
  features!: string[];

  @Prop({ default: 30 })
  durationDays!: number;

  @Prop({ type: Number, default: 0 })
  usageLimit!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PackageSchema = SchemaFactory.createForClass(Package);

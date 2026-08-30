import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type JobDocument = HydratedDocument<Job>;

export const JOB_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'published',
  'closed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'permanent',
] as const;

export type JobType = (typeof JOB_TYPES)[number];

@Schema({ timestamps: true })
export class Job {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  organizationUserId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  postCode?: string;

  @Prop({ type: String, enum: JOB_TYPES })
  jobType?: JobType;

  @Prop({ min: 0 })
  salaryMin?: number;

  @Prop({ min: 0 })
  salaryMax?: number;

  @Prop({ default: 'GBP' })
  salaryCurrency?: string;

  @Prop({ type: [String], default: [] })
  requiredSkills!: string[];

  @Prop({ default: 0 })
  requiredExperience?: number;

  @Prop({ type: [String], default: [] })
  requirements!: string[];

  @Prop({ trim: true })
  department?: string;

  @Prop({ type: [String], default: [] })
  benefits?: string[];

  @Prop({ trim: true })
  hoursPerWeek?: string;

  @Prop({ trim: true, default: 'Permanent' })
  contractType?: string;

  @Prop({ type: [String], default: [] })
  workLocations?: string[];

  @Prop({ type: [String], default: [] })
  workingPatterns?: string[];

  @Prop({ trim: true })
  minExperience?: string;

  @Prop({ trim: true })
  pinRequired?: string;

  @Prop({ default: false })
  isFeaturedBoost?: boolean;

  @Prop({ default: false })
  isUrgentHire?: boolean;

  @Prop({ type: String, enum: JOB_STATUSES, default: 'draft' })
  status!: JobStatus;

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop()
  closesAt?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.index({ organizationUserId: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ isPublished: 1 });
JobSchema.index({ city: 1 });
JobSchema.index({ postCode: 1 });

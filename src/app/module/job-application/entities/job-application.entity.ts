import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type JobApplicationDocument = HydratedDocument<JobApplication>;

export const JOB_APPLICATION_STATUSES = [
  'pending',
  'new',
  'shortlisted',
  'interview',
  'accepted',
  'hired',
  'rejected',
  'withdrawn',
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

@Schema({ timestamps: true })
export class JobApplication {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: false })
  jobId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  carerUserId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  organizationUserId?: Types.ObjectId;

  @Prop({ trim: true })
  name?: string;

  @Prop({ trim: true })
  initials?: string;

  @Prop({ default: 'bg-emerald-600' })
  avatarBg?: string;

  @Prop({ default: '5 years' })
  experience?: string;

  @Prop({ default: 'Senior Care Assistant' })
  role?: string;

  @Prop({ default: 'Manchester' })
  location?: string;

  @Prop({ default: 85 })
  matchScore?: number;

  @Prop({ default: true })
  verified?: boolean;

  @Prop({ default: '' })
  notes?: string;

  @Prop({
    type: [{ name: String, size: String }],
    default: [],
  })
  documents?: { name: string; size: string }[];

  @Prop({ trim: true })
  coverLetter?: string;

  @Prop({
    type: String,
    enum: JOB_APPLICATION_STATUSES,
    default: 'new',
  })
  status!: JobApplicationStatus;

  @Prop({ default: Date.now })
  appliedAt!: Date;
}

export const JobApplicationSchema =
  SchemaFactory.createForClass(JobApplication);

JobApplicationSchema.index({ jobId: 1, carerUserId: 1 }, { unique: true, sparse: true });
JobApplicationSchema.index({ organizationUserId: 1 });
JobApplicationSchema.index({ carerUserId: 1 });
JobApplicationSchema.index({ jobId: 1, status: 1 });

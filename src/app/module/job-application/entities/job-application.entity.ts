import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type JobApplicationDocument = HydratedDocument<JobApplication>;

export const JOB_APPLICATION_STATUSES = [
  'pending',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

@Schema({ timestamps: true })
export class JobApplication {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true })
  jobId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  carerUserId!: Types.ObjectId;

  @Prop({ trim: true })
  coverLetter?: string;

  @Prop({
    type: String,
    enum: JOB_APPLICATION_STATUSES,
    default: 'pending',
  })
  status!: JobApplicationStatus;

  @Prop({ default: Date.now })
  appliedAt!: Date;
}

export const JobApplicationSchema =
  SchemaFactory.createForClass(JobApplication);

JobApplicationSchema.index({ jobId: 1, carerUserId: 1 }, { unique: true });
JobApplicationSchema.index({ carerUserId: 1 });
JobApplicationSchema.index({ jobId: 1, status: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type JobAuditLogDocument = HydratedDocument<JobAuditLog>;

export const JOB_AUDIT_ACTIONS = ['approve-job', 'reject-job'] as const;

export type JobAuditAction = (typeof JOB_AUDIT_ACTIONS)[number];

@Schema({ timestamps: true })
export class JobAuditLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actorUserId!: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true })
  jobId!: Types.ObjectId | string;

  @Prop({ type: String, enum: JOB_AUDIT_ACTIONS, required: true })
  action!: JobAuditAction;

  @Prop()
  previousStatus?: string;

  @Prop({ required: true })
  nextStatus!: string;

  @Prop()
  reason?: string;
}

export const JobAuditLogSchema = SchemaFactory.createForClass(JobAuditLog);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SavedJobDocument = HydratedDocument<SavedJob>;

@Schema({ timestamps: true })
export class SavedJob {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  carerUserId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true })
  jobId!: Types.ObjectId;
}

export const SavedJobSchema = SchemaFactory.createForClass(SavedJob);
SavedJobSchema.index({ carerUserId: 1, jobId: 1 }, { unique: true });

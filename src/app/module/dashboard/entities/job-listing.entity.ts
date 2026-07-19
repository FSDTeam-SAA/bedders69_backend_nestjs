import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JobListingDocument = HydratedDocument<JobListing>;

@Schema({ timestamps: true, collection: 'jobs' })
export class JobListing {
  @Prop({ trim: true })
  name!: string;

  @Prop({ trim: true })
  employmentType!: string;

  @Prop({ trim: true })
  employmentTime!: string;

  @Prop({ trim: true })
  title!: string;

  @Prop({ trim: true })
  location!: string;

  @Prop({ trim: true })
  experienceLevel!: string;

  @Prop({ default: 'active' })
  status?: string;
}

export const JobListingSchema = SchemaFactory.createForClass(JobListing);

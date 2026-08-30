import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SavedCarerDocument = HydratedDocument<SavedCarer>;

@Schema({ timestamps: true })
export class SavedCarer {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  carerId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 4.8 })
  rating!: number;

  @Prop({ default: 50 })
  reviews!: number;

  @Prop({ default: 'Manchester, M1' })
  location!: string;

  @Prop({ default: '' })
  bio!: string;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ default: '2+ Years' })
  experience!: string;

  @Prop({ default: 'DBS Verified' })
  verified!: string;

  @Prop({ default: '$140/hrs' })
  rate!: string;

  @Prop({ default: true })
  available!: boolean;

  @Prop({ default: '' })
  image!: string;

  @Prop({ type: [String], default: [] })
  qualifications!: string[];

  @Prop({ default: 'Mon–Fri 7am–6pm · Sat 8am–2pm' })
  availability!: string;

  @Prop({ default: 'Manchester, Greater Manchester' })
  serviceArea!: string;
}

export const SavedCarerSchema = SchemaFactory.createForClass(SavedCarer);

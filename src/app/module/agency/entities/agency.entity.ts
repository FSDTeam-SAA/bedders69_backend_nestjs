import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AgencyDocument = HydratedDocument<Agency>;

@Schema({ timestamps: true })
export class Agency {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  registerNumber!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  website!: string;

  @Prop()
  discription!: string;

  @Prop()
  alternatageEmail?: string;

  @Prop()
  address!: string;

  @Prop()
  specialisations!: string[];

  @Prop()
  documents?: string[];

  @Prop({ enum: ['approved', 'pending', 'rejected'], default: 'pending' })
  status?: string;

  @Prop({ enum: ['incomplete', 'complete'], default: 'incomplete' })
  profileCompletionStatus!: string;

  @Prop({ default: 0 })
  profileCompletionPercentage!: number;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

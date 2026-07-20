import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CareDocument = HydratedDocument<Care>;

const LocationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class Care {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Company' })
  companyId!: Types.ObjectId;

  @Prop()
  careName!: string;

  @Prop()
  profilePicture!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  email!: string;

  @Prop()
  dateOfBirth!: Date;

  @Prop({ enum: ['male', 'female'] })
  gender!: string;

  @Prop({ default: false })
  hasDrivingLicense!: boolean;

  @Prop({ default: false })
  hasVehicle!: boolean;

  @Prop()
  address!: string;

  @Prop()
  postCode!: string;

  @Prop({ type: LocationSchema })
  location!: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop()
  shifts!: string;

  @Prop({ type: [String] })
  specialisms!: string[];

  @Prop({ default: 0 })
  yearsOfExperience!: number;

  @Prop({ type: [String] })
  skills!: string[];

  @Prop({ type: [String] })
  documents!: string[];

  @Prop({ default: false })
  isPremium!: boolean;

  @Prop({ default: false })
  isFeatured!: boolean;

  @Prop({ default: false })
  isAvailable!: boolean;

  @Prop({ default: false })
  isActive!: boolean;

  @Prop({ default: 0 })
  profileViews!: number;

  @Prop({ default: [] })
  applications!: Types.ObjectId[];
}

export const CareSchema = SchemaFactory.createForClass(Care);

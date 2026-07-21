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

@Schema({ _id: false })
export class Experience {
  @Prop()
  companyName!: string;

  @Prop()
  jobTitle!: string;

  @Prop()
  startDate!: Date;

  @Prop()
  endDate!: Date;

  @Prop()
  responsibilities!: string;
}

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

  @Prop()
  country!: string;

  @Prop()
  region!: string;

  @Prop()
  nationality!: string;

  @Prop()
  address!: string;

  @Prop()
  postCode!: string;

  @Prop({ type: LocationSchema })
  location!: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ default: 0 })
  yearsOfExperience!: number;

  @Prop()
  rightToWorkInUk!: boolean;

  @Prop({ default: false })
  hasDrivingLicense!: boolean;

  @Prop({ default: false })
  hasVehicle!: boolean;

  @Prop()
  professionalSummary!: string;

  @Prop({ type: [Experience], default: [] })
  experience!: Experience[];

  @Prop({ default: [] })
  skills!: string[];

  @Prop({ default: [] })
  specialisms!: string[];

  @Prop({ default: [] })
  workPreferences!: string[];

  @Prop()
  currentAvailability!: string;

  @Prop()
  shifts!: string;

  @Prop()
  preferredRegions!: string;

  @Prop()
  preferredCities!: string;

  @Prop()
  maximumTravelDistance!: string;

  @Prop({ default: [] })
  preferredWorkType!: string[];

  @Prop({ default: [] })
  preferredShift!: string[];

  @Prop()
  cv!: string;

  @Prop()
  documents!: string[];

  @Prop({ default: false })
  isPremium!: boolean;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  profileViews!: number;

  @Prop({ default: [] })
  applications!: Types.ObjectId[];

  @Prop({ enum: ['incomplete', 'complete'], default: 'incomplete' })
  profileCompletionStatus!: string;

  @Prop({ default: 0 })
  profileCompletionPercentage!: number;
}

export const CareSchema = SchemaFactory.createForClass(Care);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;
@Schema({ timestamps: true })
export class Company {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ unique: true })
  companyName!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  registerNumber!: string;

  @Prop()
  websiteLink!: string;

  @Prop()
  address!: string;

  @Prop({
    type: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    _id: false,
  })
  location!: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop()
  postCode!: string;

  @Prop()
  logo?: string;

  @Prop()
  coverPhoto?: string;

  @Prop()
  coverageRegions?: string[];

  @Prop()
  serviceOffered?: string[];

  @Prop({ enum: ['approved', 'pending', 'rejected'], default: 'pending' })
  status?: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

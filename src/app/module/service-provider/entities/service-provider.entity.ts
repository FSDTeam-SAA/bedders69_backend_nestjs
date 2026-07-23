import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ServiceProviderDocument = HydratedDocument<ServiceProvider>;

@Schema({ timestamps: true })
export class ServiceProvider {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  companyName!: string;

  @Prop()
  bussinessDescription!: string;

  @Prop()
  websiteLink!: string;

  @Prop()
  serviceCoverArea!: string;

  @Prop()
  bussinessResgistrationNumber!: string;

  @Prop()
  logo?: string;

  @Prop()
  coverPhoto?: string;

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    _id: false,
  })
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const ServiceProviderSchema =
  SchemaFactory.createForClass(ServiceProvider);

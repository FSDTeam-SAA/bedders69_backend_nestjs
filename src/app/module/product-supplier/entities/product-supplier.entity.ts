import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProductSupplierDocument = HydratedDocument<ProductSupplier>;

@Schema({ timestamps: true })
export class ProductSupplier {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  storeName!: string;

  @Prop()
  description!: string;

  @Prop()
  websiteLink!: string;

  @Prop()
  state!: string;

  @Prop()
  country!: string;

  @Prop()
  nantionality!: string;

  @Prop()
  address!: string;

  @Prop()
  postCode!: string;

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

  @Prop({ enum: ['incomplete', 'complete'], default: 'incomplete' })
  profileCompletionStatus!: string;

  @Prop({ default: 0 })
  profileCompletionPercentage!: number;
}

export const ProductSupplierSchema =
  SchemaFactory.createForClass(ProductSupplier);

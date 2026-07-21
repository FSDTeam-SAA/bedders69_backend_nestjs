import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, trim: true })
  serviceName!: string;

  @Prop()
  description!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  duration!: number;

  @Prop({ default: false })
  location!: boolean;

  @Prop({ required: true, enum: ['active', 'deactivate'], default: 'active' })
  status!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  serviceProviderId!: Types.ObjectId;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

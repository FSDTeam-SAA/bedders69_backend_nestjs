import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BannerDocument = HydratedDocument<Banner>;

@Schema({ timestamps: true })
export class Banner {
  @Prop({ trim: true })
  title?: string;

  @Prop({ required: true })
  image!: string;

  @Prop()
  imagePublicId?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  link?: string;

  @Prop({ default: true })
  isActive?: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

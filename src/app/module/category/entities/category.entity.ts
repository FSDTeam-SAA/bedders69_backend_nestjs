import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  supplierId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description!: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

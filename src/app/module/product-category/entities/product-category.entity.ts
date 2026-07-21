import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProductCategoryDocument = HydratedDocument<ProductCategory>;

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ required: true, trim: true })
  categoryName!: string;

  @Prop()
  description!: string;

  @Prop({ required: true, enum: ['active', 'deactivate'], default: 'active' })
  status!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  supplierId!: Types.ObjectId;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);

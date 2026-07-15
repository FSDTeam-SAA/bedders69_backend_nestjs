import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  supplierId!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  productName!: string;

  @Prop()
  description!: string;

  @Prop({ required: true, enum: ['active', 'deactivate'], default: 'active' })
  status!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ type: [String], default: [] })
  photo!: string[];

  @Prop({ required: true })
  price!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

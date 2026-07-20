import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MarketplaceDocument = HydratedDocument<Marketplace>;

@Schema({ timestamps: true, collection: 'marketplaces' })
export class Marketplace {
  @Prop({ trim: true })
  name!: string;

  @Prop({ trim: true })
  category!: string;

  @Prop()
  price!: number;

  @Prop()
  expiryDate!: Date;
}

export const MarketplaceSchema = SchemaFactory.createForClass(Marketplace);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose, { Types } from 'mongoose';

export type MembershipPlanDocument = HydratedDocument<MembershipPlan>;

@Schema({ timestamps: true })
export class MembershipPlan {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true, enum: ['monthly', 'yearly'] })
  duration!: string;

  @Prop({ default: false })
  isPopular!: boolean;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
  members!: Types.ObjectId[];
}

export const MembershipPlanSchema =
  SchemaFactory.createForClass(MembershipPlan);

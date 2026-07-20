import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type FamilyDocument = HydratedDocument<Family>;

@Schema({ timestamps: true })
export class Family {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  postCode!: string;

  @Prop()
  city!: string;

  @Prop()
  street!: string;

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

  @Prop({ type: [String], default: [] })
  careNeeds!: string[];

  @Prop()
  profilePicture!: string;

  @Prop({ enum: ['incomplete', 'complete'], default: 'incomplete' })
  profileCompletionStatus!: string;

  @Prop({ default: 0 })
  profileCompletionPercentage!: number;
}

export const FamilySchema = SchemaFactory.createForClass(Family);

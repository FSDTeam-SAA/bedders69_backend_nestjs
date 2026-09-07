import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CareSkillDocument = HydratedDocument<CareSkill>;

@Schema({ timestamps: true })
export class CareSkill {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive?: boolean;
}

export const CareSkillSchema = SchemaFactory.createForClass(CareSkill);

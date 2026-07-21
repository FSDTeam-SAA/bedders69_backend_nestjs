import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type agencyDocument = HydratedDocument<Agency>;
@Schema({ timestamps: true })
export class Agency {
  @Prop()
  name!: string;

  @Prop()
  registerNumber!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  website!: string;

  @Prop()
  address!: string;

  @Prop()
  discription!: string;

  @Prop()
  alternatageEmail!: string;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

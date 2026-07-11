import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;
@Schema({ timestamps: true })
export class Company {}

export const CompanySchema = SchemaFactory.createForClass(Company);

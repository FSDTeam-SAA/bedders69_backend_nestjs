import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { HydratedDocument } from 'mongoose';
import config from '../../../config';
export type UserDocument = HydratedDocument<User>;

export const USER_ROLES = [
  'admin',
  'care_company',
  'agency',
  'carer',
  'supplier',
  'service_provider',
  'family',
] as const;

export const USER_STATUSES = [
  'pending',
  'active',
  'suspended',
  'rejected',
  'deleted',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

@Schema({ timestamps: true })
export class User {
  @Prop({ trim: true })
  fullName!: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  })
  password!: string;

  @Prop({
    type: String,
    enum: USER_ROLES,
    default: 'family',
  })
  role!: UserRole;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiry?: Date;

  @Prop({ type: String, enum: USER_STATUSES, default: 'pending' })
  status!: UserStatus;

  @Prop({ enum: ['male', 'female'] })
  gender?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  country?: string;

  @Prop()
  city?: string;

  @Prop()
  address?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  verifiedForget!: boolean;

  @Prop()
  stripeAccountId!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcryptSaltRounds),
  );
});

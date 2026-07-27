import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { USER_ROLES, USER_STATUSES } from '../entities/user.entity';
import type { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: '' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: USER_ROLES })
  @IsOptional()
  @IsEnum(USER_ROLES)
  role?: UserRole;

  @ApiPropertyOptional({ enum: ['male', 'female'] })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ type: String, format: 'binary' })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  otpExpiry?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  verifiedForget?: boolean;

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsEnum(USER_STATUSES)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}

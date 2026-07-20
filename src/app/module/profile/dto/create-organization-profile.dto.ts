import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ORGANIZATION_PROFILE_TYPES } from '../entities/organization-profile.entity';
import type { OrganizationProfileType } from '../entities/organization-profile.entity';

const parseStringArray = (value: unknown): unknown => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  if (value.trim() === '') return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
};

export class CreateOrganizationProfileDto {
  @ApiProperty({ enum: ORGANIZATION_PROFILE_TYPES, example: 'agency' })
  @IsEnum(ORGANIZATION_PROFILE_TYPES)
  profileType!: OrganizationProfileType;

  @ApiProperty({ example: 'Bedders Recruitment Ltd' })
  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @ApiProperty({ example: 'agency@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiPropertyOptional({ example: '+447700900123' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '221B Baker Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'London' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SW1A 1AA' })
  @IsOptional()
  @IsString()
  postCode?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  websiteLink?: string;

  @ApiPropertyOptional({ example: 'Specialist care recruitment agency.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['Recruitment', 'Temporary Staffing'] })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}

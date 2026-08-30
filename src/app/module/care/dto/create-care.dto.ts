import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const parseStringArray = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (value.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
};

const parseBoolean = (value: unknown): unknown => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return value;
};

const parseNumber = (value: unknown): unknown => {
  if (typeof value === 'number') {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !isNaN(Number(value))
  ) {
    return Number(value);
  }

  return value;
};

const parseJsonArray = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (value.trim() === '') {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
};

const parseLocation = (value: unknown): unknown => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  let location: unknown;

  try {
    location = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }

  if (
    location &&
    typeof location === 'object' &&
    'latitude' in location &&
    'longitude' in location
  ) {
    const { latitude, longitude } = location as {
      latitude: number | string;
      longitude: number | string;
    };

    return {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };
  }

  return location;
};

export class LocationDto {
  @ApiProperty({
    example: 'Point',
    enum: ['Point'],
  })
  @IsString()
  type!: 'Point';

  @ApiProperty({
    example: [-0.1278, 51.5074],
    type: [Number],
    description: '[longitude, latitude]',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}

export class ExperienceDto {
  @ApiPropertyOptional({ example: 'Bedders Care Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Care Assistant' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: '2022-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2024-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({
    example: 'Supported elderly clients with daily care.',
  })
  @IsOptional()
  @IsString()
  responsibilities?: string;
}

export class CreateCareDto {
  @ApiProperty({
    example: 'John Smith',
  })
  @IsString()
  @IsNotEmpty()
  careName!: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    example: '+447700900123',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    example: 'carer@gmail.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'secret123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({
    example: '1995-08-15',
    format: 'date',
  })
  @IsDateString()
  dateOfBirth!: Date;

  @ApiProperty({
    enum: ['male', 'female'],
    example: 'male',
  })
  @IsEnum(['male', 'female'])
  gender!: 'male' | 'female';

  @ApiProperty({
    example: '123 High Street, London',
  })
  @IsString()
  address!: string;

  @ApiPropertyOptional({
    example: 'United Kingdom',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 'England',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({
    example: 'British',
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({
    example: 'SW1A 1AA',
  })
  @IsString()
  postCode!: string;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: 'Sibling' })
  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;

  @ApiPropertyOptional({ example: '+447700900124' })
  @IsOptional()
  @IsString()
  emergencyContactPhoneNumber?: string;

  @ApiProperty({
    example: { latitude: 51.5074, longitude: -0.1278 },
  })
  @Transform(({ value }) => parseLocation(value))
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiPropertyOptional({
    example: ['Dementia Care', 'Personal Care'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  specialisms?: string[];

  @ApiPropertyOptional({
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  rightToWorkInUk?: boolean;

  @ApiPropertyOptional({
    example: 'Experienced carer with dementia and personal care background.',
  })
  @IsOptional()
  @IsString()
  professionalSummary?: string;

  @ApiPropertyOptional({
    type: [ExperienceDto],
  })
  @IsOptional()
  @Transform(({ value }) => parseJsonArray(value))
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @ApiPropertyOptional({
    example: ['First Aid', 'Medication Assistance'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    example: ['Live-in care', 'Night care'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  workPreferences?: string[];

  @ApiPropertyOptional({
    example: 'Immediate',
  })
  @IsOptional()
  @IsString()
  currentAvailability?: string;

  @ApiPropertyOptional({
    example: 'London, South East',
  })
  @IsOptional()
  @IsString()
  preferredRegions?: string;

  @ApiPropertyOptional({
    example: 'London, Croydon',
  })
  @IsOptional()
  @IsString()
  preferredCities?: string;

  @ApiPropertyOptional({
    example: '25 miles',
  })
  @IsOptional()
  @IsString()
  maximumTravelDistance?: string;

  @ApiPropertyOptional({
    example: ['Full-time', 'Part-time'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  preferredWorkType?: string[];

  @ApiPropertyOptional({
    example: ['Day', 'Night'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  preferredShift?: string[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  cv?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  profileViews?: number;

  @ApiPropertyOptional({
    example: ['687a0b2d5e5a8d8d3c2d9999'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  applications?: string[];
}

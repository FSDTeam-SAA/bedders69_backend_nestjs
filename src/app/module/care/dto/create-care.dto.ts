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

const parseLocation = (value: unknown): unknown => {
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

class LocationDto {
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

export class CreateCareDto {
  @ApiPropertyOptional({
    example: '',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({
    example: '',
  })
  @IsMongoId()
  @IsOptional()
  companyId?: string;

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

  @ApiPropertyOptional({
    example: '123456',
  })
  @IsOptional()
  @IsString()
  password?: string;

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

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  hasDrivingLicense?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  hasVehicle?: boolean;

  @ApiProperty({
    example: '123 High Street, London',
  })
  @IsString()
  address!: string;

  @ApiProperty({
    example: 'SW1A 1AA',
  })
  @IsString()
  postCode!: string;

  @ApiProperty({
    example: { latitude: 51.5074, longitude: -0.1278 },
  })
  @Transform(({ value }) => parseLocation(value))
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiProperty({
    example: 'Day',
  })
  @IsString()
  shifts!: string;

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
    example: ['First Aid', 'Medication Assistance'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

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
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isFeatured?: boolean;

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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

const parseStringArray = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
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
  @ApiPropertyOptional({
    example: 'Point',
    enum: ['Point'],
    default: 'Point',
  })
  @IsEnum(['Point'])
  @IsOptional()
  type?: 'Point';

  @ApiProperty({
    example: [90.4125, 23.8103],
    description: '[longitude, latitude]',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates!: [number, number];
}

export class CreateCompanyDto {
  @ApiProperty({ example: 'ABC Company Ltd' })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiProperty({ example: 'company@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @ApiProperty({ example: 'REG-123456' })
  @IsString()
  @IsNotEmpty()
  registerNumber!: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsUrl()
  @IsOptional()
  websiteLink?: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ type: LocationDto })
  @Transform(({ value }) => parseLocation(value))
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiProperty({ example: '1207' })
  @IsString()
  @IsNotEmpty()
  postCode!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  coverPhoto?: string;

  @ApiPropertyOptional({
    example: ['Dhaka', 'Chattogram'],
    type: [String],
  })
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  coverageRegions?: string[];

  @ApiPropertyOptional({
    example: ['Delivery', 'Logistics'],
    type: [String],
  })
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceOffered?: string[];

  @ApiPropertyOptional({
    example: 'pending',
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  })
  @IsEnum(['approved', 'pending', 'rejected'])
  @IsOptional()
  status?: 'approved' | 'pending' | 'rejected';

  @ApiProperty({
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  cvResume?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocuments?: string[];
}

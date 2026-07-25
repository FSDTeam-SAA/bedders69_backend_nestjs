import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @ApiProperty({ example: 23.8103 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 90.4125 })
  @IsNumber()
  longitude!: number;
}

export class CreateProductSupplierDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'supplier@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ example: 'ABC Supplies Store' })
  @IsString()
  storeName!: string;

  @ApiProperty({
    example: 'We supply mobility aids and daily living equipment.',
  })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'https://abcsupplies.com' })
  @IsUrl()
  websiteLink!: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  state!: string;

  @ApiProperty({ example: 'Bangladesh' })
  @IsString()
  country!: string;

  @ApiProperty({ example: 'British' })
  @IsString()
  nantionality!: string;

  @ApiProperty({ example: 'House-12, Road-5, Dhanmondi, Dhaka' })
  @IsString()
  address!: string;

  @ApiProperty({ example: '1207' })
  @IsString()
  postCode!: string;

  @ApiPropertyOptional({ type: String, format: 'binary' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ type: String, format: 'binary' })
  @IsOptional()
  @IsString()
  coverPhoto?: string;

  @ApiPropertyOptional({ type: () => LocationDto })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      const location = typeof value === 'string' ? JSON.parse(value) : value;
      return Object.assign(new LocationDto(), location);
    } catch {
      return value;
    }
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

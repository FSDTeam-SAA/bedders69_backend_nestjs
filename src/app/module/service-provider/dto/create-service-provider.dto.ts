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

export class CreateServiceProviderDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'provider@example.com' })
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

  @ApiProperty({ example: 'ABC Services Ltd' })
  @IsString()
  companyName!: string;

  @ApiProperty({
    example: 'We provide home cleaning and maintenance services.',
  })
  @IsString()
  bussinessDescription!: string;

  @ApiProperty({ example: 'https://abcservices.com' })
  @IsUrl()
  websiteLink!: string;

  @ApiProperty({ example: 'Dhaka, Gazipur' })
  @IsString()
  serviceCoverArea!: string;

  @ApiProperty({ example: 'REG-123456' })
  @IsString()
  bussinessResgistrationNumber!: string;

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

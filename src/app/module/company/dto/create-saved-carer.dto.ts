import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSavedCarerDto {
  @ApiProperty({ example: 'carer-123' })
  @IsString()
  @IsNotEmpty()
  carerId!: string;

  @ApiProperty({ example: 'Matthew Warkentin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 4.9 })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 67 })
  @IsNumber()
  @IsOptional()
  reviews?: number;

  @ApiPropertyOptional({ example: 'London, N1' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Compassionate Care Assistant with 5+ years experience.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: ['Dementia Care', 'Medication Admin'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ example: '2 Years' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ example: 'DBS Verified' })
  @IsString()
  @IsOptional()
  verified?: string;

  @ApiPropertyOptional({ example: '$150/hrs' })
  @IsString()
  @IsOptional()
  rate?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: ['NVQ Level 3 Health & Social Care'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[];

  @ApiPropertyOptional({ example: 'Mon–Fri 7am–6pm · Sat 8am–2pm' })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({ example: 'Manchester, Greater Manchester' })
  @IsString()
  @IsOptional()
  serviceArea?: string;
}

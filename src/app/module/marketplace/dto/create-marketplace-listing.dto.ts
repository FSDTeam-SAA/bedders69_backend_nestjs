import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMarketplaceListingDto {
  @ApiProperty({ example: 'Adjustable profiling care bed' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Lightly used care bed in excellent shape.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'equipment' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'London' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SW1A 1AA' })
  @IsOptional()
  @IsString()
  postCode?: string;

  @ApiPropertyOptional({
    example: ['https://cdn.example.com/care-bed.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PACKAGE_TYPES } from '../entities/package.entity';
import type { PackageType } from '../entities/package.entity';

export class CreatePackageDto {
  @ApiProperty({ example: 'Gold Membership' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Full access to restricted carer directory' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PACKAGE_TYPES, example: 'membership' })
  @IsEnum(PACKAGE_TYPES)
  @IsNotEmpty()
  type!: PackageType;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['Restricted carer search', 'Priority listing'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: 30, description: 'Duration in days' })
  @IsNumber()
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional({
    example: 0,
    description: '0 means unlimited usage',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  usageLimit?: number;
}

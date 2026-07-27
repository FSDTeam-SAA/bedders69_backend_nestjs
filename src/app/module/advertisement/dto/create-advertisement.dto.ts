import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ADVERTISEMENT_PLACEMENTS } from '../entities/advertisement.entity';
import type { AdvertisementPlacement } from '../entities/advertisement.entity';

export class CreateAdvertisementDto {
  @ApiProperty({ example: 'Premium home care beds now available' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Promote seasonal equipment offers to care providers.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ADVERTISEMENT_PLACEMENTS, example: 'marketplace_top' })
  @IsEnum(ADVERTISEMENT_PLACEMENTS)
  placement!: AdvertisementPlacement;

  @ApiPropertyOptional({ example: 'https://example.com/care-beds' })
  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString()
  endsAt!: string;
}

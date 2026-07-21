import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'Welcome Offer' })
  @IsString()
  couponName!: string;

  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  couponCode!: string;

  @ApiPropertyOptional({ example: 'Discount for first order' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  discountValue!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allUsers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  firstTime?: boolean;

  @ApiProperty({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  totalUsageLimit!: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  expiryDate!: string;
}

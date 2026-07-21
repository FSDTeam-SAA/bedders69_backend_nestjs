import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponValidity } from '../entities/coupon.entity';

export class CreateDashboardCouponDto {
  @ApiProperty({ example: 'Summer Discount' })
  @IsString()
  couponName!: string;

  @ApiProperty({ example: 'SUMMER20' })
  @IsString()
  couponCode!: string;

  @ApiPropertyOptional({ example: '20 off for summer campaign' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalUsageLimit!: number;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @IsDateString()
  startDate!: Date;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  expiryDate!: Date;

  @ApiProperty({
    enum: CouponValidity,
    example: CouponValidity.ALL_USERS,
  })
  @IsEnum(CouponValidity)
  validitySettings!: CouponValidity;
}

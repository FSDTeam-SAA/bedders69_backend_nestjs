import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CouponAppliesTo } from '../entities/coupon.entity';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SUMMER25' })
  @IsString()
  couponCode!: string;

  @ApiPropertyOptional({
    enum: CouponAppliesTo,
    example: CouponAppliesTo.PRODUCT,
    description: 'The item category being purchased (PRODUCT, SUBSCRIPTION, DELIVERY, or ALL)',
  })
  @IsOptional()
  @IsEnum(CouponAppliesTo)
  category?: CouponAppliesTo;

  @ApiPropertyOptional({ example: 50.0, description: 'Product subtotal amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  productAmount?: number;

  @ApiPropertyOptional({ example: 5.0, description: 'Delivery/shipping charge amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({
    example: 49.0,
    description: 'Total purchase amount (e.g. subscription fee or total)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;
}


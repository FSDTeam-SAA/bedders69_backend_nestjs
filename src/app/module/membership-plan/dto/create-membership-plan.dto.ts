import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'Premium Plan' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 99 })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'Access to premium benefits' })
  @IsString()
  content!: string;

  @ApiProperty({ enum: ['monthly', 'yearly'], example: 'monthly' })
  @IsEnum(['monthly', 'yearly'])
  duration!: string;
}

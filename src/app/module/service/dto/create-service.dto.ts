import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Home Cleaning' })
  @IsString()
  serviceName!: string;

  @ApiPropertyOptional({ example: 'Professional cleaning service' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsNumber()
  duration!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  location?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'deactivate'], example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'deactivate'])
  status?: string;
}

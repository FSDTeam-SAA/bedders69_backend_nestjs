import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Smartphone' })
  @IsString()
  productName!: string;

  @ApiProperty({ example: '6890f3b10b5f0d5e5e123456' })
  @IsMongoId()
  categoryId!: string;

  @ApiPropertyOptional({ example: 'Latest model phone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['active', 'deactivate'], example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'deactivate'])
  status?: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/a.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  @ApiProperty({ example: 799 })
  @Type(() => Number)
  @IsNumber()
  price!: number;
}

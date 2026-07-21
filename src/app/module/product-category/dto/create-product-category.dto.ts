import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  categoryName!: string;

  @ApiPropertyOptional({ example: 'Electronic items' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['active', 'deactivate'], example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'deactivate'])
  status?: string;
}

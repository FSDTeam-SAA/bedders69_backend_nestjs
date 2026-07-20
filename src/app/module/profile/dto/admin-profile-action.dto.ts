import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class AdminProfileActionDto {
  @ApiProperty({ example: '65f1c9f234df3c9342a58f00' })
  @IsMongoId()
  userId!: string;

  @ApiPropertyOptional({ example: 'Verified by admin.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

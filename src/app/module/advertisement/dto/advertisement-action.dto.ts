import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class AdminAdvertisementActionDto {
  @ApiProperty({ example: '65f1c9f234df3c9342a58f00' })
  @IsMongoId()
  advertisementId!: string;

  @ApiPropertyOptional({ example: 'Creative and landing page are approved.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCareSkillDto {
  @ApiProperty({ example: 'Personal Care' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Assistance with daily living activities' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

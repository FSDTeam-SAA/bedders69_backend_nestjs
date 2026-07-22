import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JOB_TYPES } from '../entities/job.entity';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Care Assistant' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    example: 'Looking for an experienced care assistant...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'London' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'London' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SW1A 1AA' })
  @IsOptional()
  @IsString()
  postCode?: string;

  @ApiPropertyOptional({ enum: JOB_TYPES, example: 'full_time' })
  @IsOptional()
  @IsEnum(JOB_TYPES)
  jobType?: string;

  @ApiPropertyOptional({ example: 22000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 28000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ example: 'GBP' })
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiPropertyOptional({ example: ['personal care', 'medication management'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requiredExperience?: number;

  @ApiPropertyOptional({ example: ['DBS check', 'First aid certificate'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  closesAt?: string;
}

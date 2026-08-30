import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { JOB_TYPES } from '../entities/job.entity';
import type { JobType } from '../entities/job.entity';

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
  jobType?: JobType;

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

  @ApiPropertyOptional({ example: 'Residential Care' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: ['Paid Training', 'Pension Scheme'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ example: '37.5' })
  @IsOptional()
  @IsString()
  hoursPerWeek?: string;

  @ApiPropertyOptional({ example: 'Permanent' })
  @IsOptional()
  @IsString()
  contractType?: string;

  @ApiPropertyOptional({ example: ['Care Home', 'Community / Home Care'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workLocations?: string[];

  @ApiPropertyOptional({ example: ['Day Shifts', 'Night Shifts'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingPatterns?: string[];

  @ApiPropertyOptional({ example: '1+ years' })
  @IsOptional()
  @IsString()
  minExperience?: string;

  @ApiPropertyOptional({ example: 'Not required' })
  @IsOptional()
  @IsString()
  pinRequired?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeaturedBoost?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isUrgentHire?: boolean;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  closesAt?: string;
}

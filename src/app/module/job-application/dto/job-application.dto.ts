import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class ApplyToJobDto {
  @ApiPropertyOptional({
    example: 'I am interested in this position because...',
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;
}

export class AdminJobActionDto {
  @ApiProperty({ example: '65f1c9f234df3c9342a58f00' })
  @IsMongoId()
  jobId!: string;

  @ApiPropertyOptional({ example: 'Profile meets requirements.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ example: 'shortlisted' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ example: 'Strong candidate profile.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateApplicantDto {
  @ApiPropertyOptional({ example: 'James Okafor' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Senior Care Assistant' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: '5 years' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: 'Manchester' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'New' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 87 })
  @IsOptional()
  matchScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  documents?: { name: string; size: string }[];
}

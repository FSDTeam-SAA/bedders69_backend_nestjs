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

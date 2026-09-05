import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CONTACT_REQUEST_STATUSES } from '../entities/contact-request.entity';
import type { ContactRequestStatus } from '../entities/contact-request.entity';

export class CreateContactRequestDto {
  @ApiPropertyOptional({ example: 'Margaret Turner' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Family' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: "I'm looking for residential care for my 82-year-old mother.",
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ example: '07700 900 123' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Today 11:30' })
  @IsString()
  @IsOptional()
  time?: string;

  @ApiPropertyOptional({ example: 'MT' })
  @IsString()
  @IsOptional()
  initials?: string;

  @ApiPropertyOptional({ example: 'bg-cyan-600' })
  @IsString()
  @IsOptional()
  avatarBg?: string;

  @ApiPropertyOptional({ enum: CONTACT_REQUEST_STATUSES, example: 'Pending' })
  @IsEnum(CONTACT_REQUEST_STATUSES)
  @IsOptional()
  status?: ContactRequestStatus;

  @ApiPropertyOptional({ example: '65f1c9f234df3c9342a58f01' })
  @IsString()
  @IsOptional()
  targetUserId?: string;
}

export class UpdateContactRequestStatusDto {
  @ApiProperty({ enum: ['Accepted', 'Rejected'], example: 'Accepted' })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

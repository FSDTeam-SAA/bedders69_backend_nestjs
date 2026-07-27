import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_STATUSES,
} from '../entities/notification-log.entity';
import type {
  NotificationEvent,
  NotificationStatus,
} from '../entities/notification-log.entity';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    enum: NOTIFICATION_EVENTS,
    example: 'profile_approved',
  })
  @IsOptional()
  @IsIn(NOTIFICATION_EVENTS)
  event?: NotificationEvent;

  @ApiPropertyOptional({
    enum: NOTIFICATION_STATUSES,
    example: 'sent',
  })
  @IsOptional()
  @IsIn(NOTIFICATION_STATUSES)
  status?: NotificationStatus;

  @ApiPropertyOptional({ example: 'carer@example.com' })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  sortOrder?: string;
}

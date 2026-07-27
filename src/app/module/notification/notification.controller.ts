import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationService } from './notification.service';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_STATUSES,
} from './entities/notification-log.entity';

@ApiTags('Notifications')
@Controller('admin/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('get-notification-logs')
  @ApiOperation({
    summary: 'Get notification logs',
    description:
      'Returns logged MVP email notifications with filters for event, status, and recipient email.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiQuery({ name: 'event', required: false, enum: NOTIFICATION_EVENTS })
  @ApiQuery({ name: 'status', required: false, enum: NOTIFICATION_STATUSES })
  @ApiQuery({ name: 'recipientEmail', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification logs fetched successfully',
    schema: {
      example: {
        message: 'Notification logs fetched successfully',
        meta: { page: 1, limit: 10, total: 1 },
        data: [
          {
            id: '65f1c9f234df3c9342a58f00',
            event: 'profile_approved',
            channel: 'email',
            status: 'sent',
            recipientEmail: 'care@example.com',
            subject: 'Your Bedders profile has been approved',
          },
        ],
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async getNotificationLogs(@Query() query: GetNotificationsQueryDto) {
    const filters = pick(query, ['event', 'status', 'recipientEmail']);
    const options = pick(query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await this.notificationService.getNotificationLogs(
      filters,
      options,
    );

    return {
      message: 'Notification logs fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }
}

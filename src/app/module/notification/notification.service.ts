import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import sendMailer from 'src/app/helpers/sendMailer';
import {
  NotificationEvent,
  NotificationLog,
  NotificationLogDocument,
} from './entities/notification-log.entity';
import {
  NotificationTemplateInput,
  renderNotificationTemplate,
} from './notification.templates';

interface NotifyEmailInput {
  event: NotificationEvent;
  recipientEmail?: string;
  recipientName?: string;
  recipientUserId?: string;
  templateData?: NotificationTemplateInput;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
  ) {}

  async notifyEmail(input: NotifyEmailInput) {
    if (!input.recipientEmail) {
      return this.notificationLogModel.create({
        event: input.event,
        channel: 'email',
        status: 'skipped',
        recipientEmail: 'unknown',
        recipientName: input.recipientName,
        recipientUserId: input.recipientUserId,
        subject: `Skipped ${input.event}`,
        html: '',
        metadata: input.metadata || {},
        errorMessage: 'Recipient email was not provided',
      });
    }

    const rendered = renderNotificationTemplate(input.event, {
      ...input.templateData,
      recipientName: input.recipientName ?? input.templateData?.recipientName,
    });

    const log = await this.notificationLogModel.create({
      event: input.event,
      channel: 'email',
      status: 'pending',
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      recipientUserId: input.recipientUserId,
      subject: rendered.subject,
      html: rendered.html,
      metadata: input.metadata || {},
    });

    if (input.sendEmail === false) {
      log.status = 'skipped';
      log.errorMessage = 'Email sending disabled for this notification';
      await log.save();
      return log;
    }

    try {
      await sendMailer(input.recipientEmail, rendered.subject, rendered.html);
      log.status = 'sent';
      log.sentAt = new Date();
      log.errorMessage = undefined;
    } catch (error: any) {
      log.status = 'failed';
      log.errorMessage = error?.message || 'Email delivery failed';
    }

    await log.save();
    return log;
  }

  async getNotificationLogs(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { event, status, recipientEmail } = params;
    const whereConditions: Record<string, unknown> = {};

    if (event) whereConditions.event = event;
    if (status) whereConditions.status = status;
    if (recipientEmail) {
      whereConditions.recipientEmail = {
        $regex: recipientEmail,
        $options: 'i',
      };
    }

    const [total, logs] = await Promise.all([
      this.notificationLogModel.countDocuments(whereConditions),
      this.notificationLogModel
        .find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean(),
    ]);

    return { meta: { page, limit, total }, data: logs };
  }
}

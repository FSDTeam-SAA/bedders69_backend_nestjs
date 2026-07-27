import sendMailer from 'src/app/helpers/sendMailer';
import { NotificationService } from './notification.service';

jest.mock('src/app/helpers/sendMailer', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const buildNotificationLogModel = () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
});

const buildLogDocument = (overrides: Record<string, unknown> = {}) => ({
  _id: 'notification-id',
  status: 'pending',
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and marks an email notification as sent', async () => {
    const notificationLogModel = buildNotificationLogModel();
    const log = buildLogDocument();
    notificationLogModel.create.mockResolvedValue(log);
    (sendMailer as jest.Mock).mockResolvedValue(undefined);
    const service = new NotificationService(notificationLogModel as any);

    const result = await service.notifyEmail({
      event: 'profile_approved',
      recipientEmail: 'care@example.com',
      recipientName: 'Care Company',
      recipientUserId: 'user-id',
      templateData: { profileRole: 'care_company' },
      metadata: { targetUserId: 'user-id' },
    });

    expect(notificationLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'profile_approved',
        channel: 'email',
        status: 'pending',
        recipientEmail: 'care@example.com',
        subject: 'Your Bedders profile has been approved',
      }),
    );
    expect(sendMailer).toHaveBeenCalledWith(
      'care@example.com',
      'Your Bedders profile has been approved',
      expect.stringContaining('Care Company'),
    );
    expect(log.status).toBe('sent');
    expect(log.sentAt).toBeInstanceOf(Date);
    expect(log.save).toHaveBeenCalled();
    expect(result).toBe(log);
  });

  it('records a skipped notification when recipient email is missing', async () => {
    const notificationLogModel = buildNotificationLogModel();
    const skippedLog = buildLogDocument({ status: 'skipped' });
    notificationLogModel.create.mockResolvedValue(skippedLog);
    const service = new NotificationService(notificationLogModel as any);

    await service.notifyEmail({
      event: 'payment_failed',
      metadata: { paymentId: 'payment-id' },
    });

    expect(sendMailer).not.toHaveBeenCalled();
    expect(notificationLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'payment_failed',
        status: 'skipped',
        recipientEmail: 'unknown',
        errorMessage: 'Recipient email was not provided',
      }),
    );
  });

  it('stores failed status when email delivery fails', async () => {
    const notificationLogModel = buildNotificationLogModel();
    const log = buildLogDocument();
    notificationLogModel.create.mockResolvedValue(log);
    (sendMailer as jest.Mock).mockRejectedValue(new Error('SMTP unavailable'));
    const service = new NotificationService(notificationLogModel as any);

    await service.notifyEmail({
      event: 'advertisement_rejected',
      recipientEmail: 'ads@example.com',
      templateData: { advertisementTitle: 'Footer ad' },
    });

    expect(log.status).toBe('failed');
    expect(log.errorMessage).toBe('SMTP unavailable');
    expect(log.save).toHaveBeenCalled();
  });
});

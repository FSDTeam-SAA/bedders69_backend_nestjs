import { NotificationEvent } from './entities/notification-log.entity';

export interface NotificationTemplateInput {
  recipientName?: string;
  actorName?: string;
  profileRole?: string;
  reason?: string;
  amount?: number;
  currency?: string;
  packageName?: string;
  jobTitle?: string;
  applicantName?: string;
  listingTitle?: string;
  inquiryName?: string;
  advertisementTitle?: string;
}

export interface RenderedNotificationTemplate {
  subject: string;
  html: string;
}

const escapeHtml = (value?: string) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const greeting = (name?: string) =>
  name ? `Hello ${escapeHtml(name)},` : 'Hello,';

const paragraph = (value: string) => `<p>${value}</p>`;

export function renderNotificationTemplate(
  event: NotificationEvent,
  input: NotificationTemplateInput,
): RenderedNotificationTemplate {
  const name = input.recipientName;
  const reason = input.reason
    ? paragraph(`<strong>Reason:</strong> ${escapeHtml(input.reason)}`)
    : '';

  const templates: Record<NotificationEvent, RenderedNotificationTemplate> = {
    profile_approved: {
      subject: 'Your Bedders profile has been approved',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `Your ${escapeHtml(input.profileRole || 'profile')} profile has been approved and is now active on Bedders.`,
        ),
      ].join(''),
    },
    profile_rejected: {
      subject: 'Your Bedders profile needs updates',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `Your ${escapeHtml(input.profileRole || 'profile')} profile was reviewed and needs updates before it can be approved.`,
        ),
        reason,
      ].join(''),
    },
    payment_succeeded: {
      subject: 'Your Bedders payment was successful',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `We received your payment${input.amount ? ` of ${escapeHtml(input.currency || 'GBP')} ${Number(input.amount).toFixed(2)}` : ''}.`,
        ),
        input.packageName
          ? paragraph(`Package: ${escapeHtml(input.packageName)}`)
          : '',
      ].join(''),
    },
    payment_failed: {
      subject: 'Your Bedders payment failed',
      html: [
        paragraph(greeting(name)),
        paragraph(
          'We could not complete your payment. Please update your payment method or try again.',
        ),
      ].join(''),
    },
    job_application_created: {
      subject: 'New job application received',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.applicantName || 'A carer')} applied to ${escapeHtml(input.jobTitle || 'your job')}.`,
        ),
      ].join(''),
    },
    marketplace_inquiry_created: {
      subject: 'New marketplace inquiry received',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.inquiryName || 'A buyer')} sent an inquiry about ${escapeHtml(input.listingTitle || 'your listing')}.`,
        ),
      ].join(''),
    },
    advertisement_approved: {
      subject: 'Your advertisement has been approved',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.advertisementTitle || 'Your advertisement')} has been approved and can now be served.`,
        ),
      ].join(''),
    },
    advertisement_rejected: {
      subject: 'Your advertisement needs updates',
      html: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.advertisementTitle || 'Your advertisement')} was reviewed and needs updates before it can be approved.`,
        ),
        reason,
      ].join(''),
    },
  };

  return templates[event];
}

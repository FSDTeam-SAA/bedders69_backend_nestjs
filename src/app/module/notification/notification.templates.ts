import { NotificationEvent } from './entities/notification-log.entity';
import { wrapInEmailLayout } from '../../helpers/emailTemplates';

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

const paragraph = (value: string) =>
  `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #475569;">${value}</p>`;

export function renderNotificationTemplate(
  event: NotificationEvent,
  input: NotificationTemplateInput,
): RenderedNotificationTemplate {
  const name = input.recipientName;
  const reason = input.reason
    ? `<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; color: #991b1b; font-size: 14px;"><strong>Reason:</strong> ${escapeHtml(input.reason)}</div>`
    : '';

  const rawTemplates: Record<
    NotificationEvent,
    { subject: string; bodyHtml: string; cta?: { label: string; url: string } }
  > = {
    profile_approved: {
      subject: 'Your The Care Directory profile has been approved',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `Your ${escapeHtml(input.profileRole || 'profile')} profile has been approved and is now active on The Care Directory.`,
        ),
      ].join(''),
      cta: {
        label: 'View Your Dashboard',
        url: 'https://www.thecaredirectory.co.uk/login',
      },
    },
    profile_rejected: {
      subject: 'Your The Care Directory profile needs updates',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `Your ${escapeHtml(input.profileRole || 'profile')} profile was reviewed and needs updates before it can be approved on The Care Directory.`,
        ),
        reason,
      ].join(''),
      cta: {
        label: 'Update Profile',
        url: 'https://www.thecaredirectory.co.uk/login',
      },
    },
    payment_succeeded: {
      subject: 'Your The Care Directory payment was successful',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `We received your payment${input.amount ? ` of ${escapeHtml(input.currency || 'GBP')} ${Number(input.amount).toFixed(2)}` : ''} on The Care Directory.`,
        ),
        input.packageName
          ? paragraph(`<strong>Package:</strong> ${escapeHtml(input.packageName)}`)
          : '',
      ].join(''),
    },
    payment_failed: {
      subject: 'Your The Care Directory payment failed',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          'We could not complete your payment on The Care Directory. Please update your payment method or try again to avoid service interruption.',
        ),
      ].join(''),
    },
    job_application_created: {
      subject: 'New job application received - The Care Directory',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.applicantName || 'A carer')} applied to ${escapeHtml(input.jobTitle || 'your job')} on The Care Directory.`,
        ),
      ].join(''),
      cta: {
        label: 'Review Application',
        url: 'https://www.thecaredirectory.co.uk/login',
      },
    },
    marketplace_inquiry_created: {
      subject: 'New marketplace inquiry received - The Care Directory',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.inquiryName || 'A buyer')} sent an inquiry about ${escapeHtml(input.listingTitle || 'your listing')} on The Care Directory.`,
        ),
      ].join(''),
      cta: {
        label: 'View Inquiries',
        url: 'https://www.thecaredirectory.co.uk/login',
      },
    },
    advertisement_approved: {
      subject: 'Your advertisement has been approved - The Care Directory',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.advertisementTitle || 'Your advertisement')} has been approved and is now active on The Care Directory.`,
        ),
      ].join(''),
    },
    advertisement_rejected: {
      subject: 'Your advertisement needs updates - The Care Directory',
      bodyHtml: [
        paragraph(greeting(name)),
        paragraph(
          `${escapeHtml(input.advertisementTitle || 'Your advertisement')} was reviewed and needs updates before it can be approved on The Care Directory.`,
        ),
        reason,
      ].join(''),
    },
  };

  const raw = rawTemplates[event];
  return {
    subject: raw.subject,
    html: wrapInEmailLayout({
      title: raw.subject,
      contentHtml: raw.bodyHtml,
      callToAction: raw.cta,
    }),
  };
}

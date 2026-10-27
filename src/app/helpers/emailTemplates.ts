export interface EmailLayoutOptions {
  title: string;
  subtitle?: string;
  contentHtml: string;
  callToAction?: {
    label: string;
    url: string;
  };
}

/**
 * Universal email layout wrapper for The Care Directory.
 * Ensures consistent branding, responsiveness, and polished appearance across all email clients.
 */
export function wrapInEmailLayout(options: EmailLayoutOptions): string {
  const ctaHtml = options.callToAction
    ? `
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${options.callToAction.url}" target="_blank" style="display: inline-block; background-color: #0e7490; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(14, 116, 144, 0.2);">
          ${options.callToAction.label}
        </a>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title} - The Care Directory</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0e7490 0%, #155e75 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.3px;">The Care Directory</h1>
              <p style="margin: 6px 0 0 0; color: #ccfbf1; font-size: 13px; font-weight: 500;">Connecting Care Providers &amp; Families</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600; line-height: 28px;">
                ${options.title}
              </h2>
              <div style="font-size: 15px; line-height: 24px; color: #475569;">
                ${options.contentHtml}
              </div>
              ${ctaHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} <strong>The Care Directory</strong>. All rights reserved.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">
                <a href="https://www.thecaredirectory.co.uk" target="_blank" style="color: #0e7490; text-decoration: none; font-weight: 500;">www.thecaredirectory.co.uk</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                This is an automated notification from The Care Directory platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates OTP verification email template with modern security box.
 */
export function generateOtpEmailTemplate(params: {
  title: string;
  description: string;
  otp: string;
  expiryMinutes: number;
  note?: string;
}): string {
  const contentHtml = `
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #475569;">
      ${params.description}
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <div style="display: inline-block; padding: 14px 28px; background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${params.otp}</span>
      </div>
      <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">
        This code will expire in <strong>${params.expiryMinutes} minutes</strong>.
      </p>
    </div>
    <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
      ${params.note || 'If you did not request this OTP code, please ignore this email or contact support.'}
    </p>
  `;

  return wrapInEmailLayout({
    title: params.title,
    contentHtml,
  });
}

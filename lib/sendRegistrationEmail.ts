import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';
import { ALOYSIUS_EVENT_NAME } from '@/lib/registrationPhases';

export type RegistrationEmailPayload = {
  registrationId: string;
  name: string;
  email: string;
  ticketId: string;
  bibNumber?: number | null;
  jerseySize?: string | null;
  entryType?: string | null;
  eventName?: string | null;
};

const EVENT_DATE = '11th October 2026';
const EVENT_TIME = '6:30 AM';
const EVENT_VENUE = 'Mangaluru';

function buildHtml(user: RegistrationEmailPayload) {
  const eventName = user.eventName || ALOYSIUS_EVENT_NAME;
  const entryLabel = user.entryType === 'free' ? 'Free Entry' : 'Paid Entry';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#FF2D87;color:#fff;text-align:center;padding:28px 20px;border-radius:16px 16px 0 0;">
      <h1 style="margin:0;font-size:22px;letter-spacing:0.08em;text-transform:uppercase;">Balipu Run Club</h1>
      <p style="margin:8px 0 0;opacity:0.95;font-size:14px;">${eventName}</p>
    </div>

    <div style="background:#ffffff;color:#1B1B4D;padding:28px 24px;border-radius:0 0 16px 16px;">
      <h2 style="margin:0 0 12px;font-size:22px;color:#FF2D87;">Congratulations, ${user.name}!</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#334155;">
        You have successfully registered for <strong>${eventName}</strong>.
        We&apos;re excited to have you with us.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;font-weight:700;">Your registration ID</p>
        <p style="margin:0;font-family:Courier,monospace;font-size:22px;font-weight:700;color:#FF2D87;letter-spacing:0.06em;">${user.ticketId}</p>
        ${
          user.bibNumber != null
            ? `<p style="margin:10px 0 0;font-size:14px;color:#475569;"><strong>BIB:</strong> ${user.bibNumber}</p>`
            : ''
        }
        <p style="margin:6px 0 0;font-size:14px;color:#475569;"><strong>Entry:</strong> ${entryLabel}</p>
        ${
          user.jerseySize
            ? `<p style="margin:6px 0 0;font-size:14px;color:#475569;"><strong>Jersey:</strong> ${user.jerseySize}</p>`
            : ''
        }
      </div>

      <h3 style="margin:24px 0 12px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#FF2D87;">Event details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:15px;color:#334155;">
        <tr>
          <td style="padding:8px 0;width:90px;font-weight:700;color:#1B1B4D;">Date</td>
          <td style="padding:8px 0;">${EVENT_DATE}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#1B1B4D;">Time</td>
          <td style="padding:8px 0;">${EVENT_TIME}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#1B1B4D;">Venue</td>
          <td style="padding:8px 0;">${EVENT_VENUE}</td>
        </tr>
      </table>

      <p style="margin:24px 0 8px;font-size:14px;line-height:1.55;color:#64748b;">
        Your unique QR code is attached to this email. Please bring it (on your phone or printed) for check-in on event day.
      </p>

      <p style="margin:20px 0 0;font-size:14px;color:#475569;">
        See you at the start line,<br/>
        <strong style="color:#FF2D87;">Balipu Run Club</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends a registration confirmation email with QR attachment.
 * Does not throw — logs and returns false on failure so registration is never blocked.
 */
export async function sendRegistrationConfirmationEmail(
  user: RegistrationEmailPayload
): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER / EMAIL_PASS not set — skipping confirmation email');
    return false;
  }

  if (!user.email || !user.ticketId) {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const qrBuffer = await QRCode.toBuffer(user.ticketId, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1B1B4D', light: '#FFFFFF' },
    });

    const eventName = user.eventName || ALOYSIUS_EVENT_NAME;

    await transporter.sendMail({
      from: `"Balipu Run Club" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Congratulations! You're registered for ${eventName}`,
      html: buildHtml(user),
      attachments: [
        {
          filename: `QR_${user.ticketId}.png`,
          content: qrBuffer,
          contentType: 'image/png',
        },
      ],
    });

    await db
      .update(registrations)
      .set({ emailSent: true, updatedAt: new Date() })
      .where(eq(registrations.id, user.registrationId));

    return true;
  } catch (err) {
    console.error('Failed to send registration confirmation email:', err);
    return false;
  }
}

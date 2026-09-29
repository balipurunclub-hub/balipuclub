import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
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

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }
  cachedTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return cachedTransporter;
}

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  if (cachedResend) return cachedResend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cachedResend = new Resend(key);
  return cachedResend;
}

function hasGmailAuth(): boolean {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const code = (err as { code?: string }).code;
  const response = (err as { response?: string }).response ?? '';
  const rcpt = (err as { responseCode?: number }).responseCode;

  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ESOCKET') return true;
  if (rcpt != null && rcpt >= 400 && rcpt < 500) return true;
  if (/rate.?limit|4\.7\.|temporary|try again later|throttled|insufficient quota/i.test(response)) return true;
  if (/econnrefused|timeout|socket|tls|dns|etimedout/.test(msg)) return true;
  return false;
}

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
 * Uses pooled SMTP connections, exponential-backoff retries for transient errors,
 * and a BCC audit copy. Does not throw — logs and returns false on final failure
 * so registration is never blocked for the end user.
 */
export async function sendRegistrationConfirmationEmail(
  user: RegistrationEmailPayload
): Promise<boolean> {
  if (!hasGmailAuth() && !getResend()) {
    console.warn('No email provider configured — set EMAIL_USER/EMAIL_PASS or RESEND_API_KEY');
    return false;
  }

  if (!user.email || !user.ticketId) {
    console.warn('sendRegistrationConfirmationEmail: missing email or ticketId for', user.registrationId);
    return false;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const qrBuffer = await QRCode.toBuffer(user.ticketId, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#1B1B4D', light: '#FFFFFF' },
      });

      const eventName = user.eventName || ALOYSIUS_EVENT_NAME;
      const subject = `Congratulations! You're registered for ${eventName}`;
      const html = buildHtml(user);
      const from = process.env.EMAIL_USER
        ? `"Balipu Run Club" <${process.env.EMAIL_USER}>`
        : `Balipu Run Club <onboarding@resend.dev>`;

      const providers: Array<() => Promise<void>> = [];

      if (hasGmailAuth()) {
        providers.push(async () => {
          const transporter = getTransporter();
          await transporter.sendMail({
            from,
            to: user.email,
            bcc: process.env.EMAIL_USER,
            subject,
            html,
            attachments: [
              {
                filename: `QR_${user.ticketId}.png`,
                content: qrBuffer,
                contentType: 'image/png',
              },
            ],
          });
        });
      }

      const resend = getResend();
      if (resend) {
        providers.push(async () => {
          await resend.emails.send({
            from,
            to: [user.email],
            bcc: process.env.EMAIL_USER ? [process.env.EMAIL_USER] : undefined,
            subject,
            html,
            attachments: [
              {
                filename: `QR_${user.ticketId}.png`,
                content: qrBuffer.toString('base64'),
              },
            ],
          });
        });
      }

      let providerSuccess = false;
      let providerError: unknown = null;

      for (const send of providers) {
        try {
          await send();
          providerSuccess = true;
          break;
        } catch (pErr) {
          providerError = pErr;
          const errMsg = pErr instanceof Error ? pErr.message : String(pErr);
          const isAuthErr = /535|BadCredentials|EAUTH|Username and Password not accepted|Invalid login/i.test(errMsg);
          console.warn(
            `sendRegistrationConfirmationEmail: provider failed for ${user.email}:`,
            pErr instanceof Error ? pErr.message : pErr,
            isAuthErr ? '— trying next provider' : ''
          );
          if (!isAuthErr) {
            break;
          }
        }
      }

      if (!providerSuccess) {
        throw providerError ?? new Error('All email providers failed');
      }

      try {
        await db
          .update(registrations)
          .set({ emailSent: true, updatedAt: new Date() })
          .where(eq(registrations.id, user.registrationId));
      } catch (dbErr) {
        console.error('Failed to mark emailSent=true for', user.registrationId, dbErr);
      }

      return true;
    } catch (err) {
      lastError = err;
      const transient = isTransientError(err);
      const isLast = attempt === MAX_RETRIES - 1;

      if (transient && !isLast) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `sendRegistrationConfirmationEmail transient error (attempt ${attempt + 1}/${MAX_RETRIES}) for ${user.email}:`,
          (err as Error).message ?? err,
          `— retrying in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      console.error(
        `sendRegistrationConfirmationEmail failed (attempt ${attempt + 1}/${MAX_RETRIES}${transient ? ' transient' : ''}) for ${user.email}:`,
        err
      );
      break;
    }
  }

  console.error('Final failure sending registration confirmation email to', user.email, 'regId:', user.registrationId, 'err:', lastError);
  return false;
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { registrations, coupons as couponsTable } from '@/lib/db/schema';
import {
  allocateAloysiusTicket,
  allocateAloysiusTicketRecovery,
  getPaidCouponUseCount,
  type AnyDb,
} from '@/lib/aloysiusRegistration';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';
import { ALOYSIUS_EVENT_NAME, feeRupeesToPaise } from '@/lib/registrationPhases';
import { findCoupon } from '@/lib/coupons';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type RzpPaymentEntity = {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  currency: string;
  captured: boolean;
};

type RzpWebhookPayload = {
  event: string;
  payload?: {
    payment?: { entity: RzpPaymentEntity };
  };
};

function logWebhook(
  level: 'info' | 'warn' | 'error',
  msg: string,
  meta: Record<string, unknown> = {}
) {
  const line = `[rzp-webhook] ${msg} :: ${JSON.stringify(meta)}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawSig = req.headers.get('x-razorpay-signature') ?? '';
  const raw = await req.text();

  if (!webhookSecret) {
    logWebhook('error', 'RAZORPAY_WEBHOOK_SECRET env not configured');
    return NextResponse.json(
      { ok: false, error: 'Webhook not configured on server — set RAZORPAY_WEBHOOK_SECRET' },
      { status: 500 }
    );
  }

  // ---- Razorpay webhook HMAC signature check (NEVER skip) ----
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(raw)
    .digest('hex');

  const a = Buffer.from(expectedSig);
  const b = Buffer.from(rawSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    logWebhook('warn', 'invalid webhook signature', { gotLen: rawSig.length });
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  let parsed: RzpWebhookPayload;
  try {
    parsed = JSON.parse(raw) as RzpWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const rzpEvent = parsed.event;
  logWebhook('info', 'received event', { event: rzpEvent });

  // Only process payment.captured events. Return 2xx to other events so Razorpay stops retrying.
  if (rzpEvent !== 'payment.captured') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `ignored event: ${rzpEvent}`,
    });
  }

  const payment = parsed.payload?.payment?.entity;
  if (!payment) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'no payment entity in webhook payload',
    });
  }

  if (!payment.captured || payment.status !== 'captured') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'payment not captured in this event',
    });
  }

  if (!payment.order_id) {
    logWebhook('warn', 'captured payment missing order_id', { paymentId: payment.id });
    return NextResponse.json({
      ok: true,
      manualReview: true,
      reason: 'payment without order_id — manual review required',
    });
  }

  if (payment.currency !== 'INR') {
    logWebhook('warn', 'captured payment non-INR currency', {
      paymentId: payment.id,
      currency: payment.currency,
    });
    return NextResponse.json({ ok: true, skipped: true, reason: 'non-INR currency' });
  }

  // ---- IDEMPOTENT + ATOMIC PROCESSING inside db.transaction ----
  try {
    type TxResult =
      | { kind: 'error'; message: string; manualReview?: boolean }
      | { kind: 'noop'; reason: string }
      | {
          kind: 'confirmed';
          registrationId: string;
          ticketId: string;
          bibNumber: number | null;
          name: string;
          email: string;
          jerseySize: string;
          entryType: string;
          eventName: string;
        };

    const result = await db.transaction<TxResult>(async (tx) => {
      const rows = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.orderId, payment.order_id!))
        .limit(1);

      const reg = rows[0];
      if (!reg) {
        return {
          kind: 'noop',
          reason: `no registration found for orderId=${payment.order_id}`,
        };
      }

      const meta = {
        registrationId: reg.id,
        orderId: payment.order_id,
        paymentId: payment.id,
        currentStatus: reg.paymentStatus,
      };

      // Idempotency: already paid. Never double-count.
      if (reg.paymentStatus === 'paid') {
        logWebhook('info', 'webhook replay — registration already paid', meta);
        let ticketId = reg.ticketId;
        let bibNumber = reg.bibNumber;
        if (!ticketId) {
          // Orphan paid row → recover WITHOUT bumping confirmedCount.
          const recovered = await allocateAloysiusTicketRecovery(tx);
          ticketId = recovered.ticketId;
          bibNumber = recovered.bibNumber;
          await tx
            .update(registrations)
            .set({
              ticketId,
              bibNumber,
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, reg.id));
          logWebhook('info', 'webhook recovered orphan paid registration', {
            ...meta,
            ticketId,
            bibNumber,
          });
        }
        return {
          kind: 'confirmed',
          registrationId: reg.id,
          ticketId,
          bibNumber,
          name: reg.name,
          email: reg.email,
          jerseySize: reg.jerseySize,
          entryType: reg.entryType ?? 'paid',
          eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
        };
      }

      // ---- Amount vs stored fee ----
      const expectedFeeRupees = Number(reg.feeRupees ?? 0);
      const expectedPaise = feeRupeesToPaise(expectedFeeRupees);
      if (payment.amount !== expectedPaise) {
        logWebhook('warn', 'amount mismatch', {
          ...meta,
          rzpAmount: payment.amount,
          expectedPaise,
        });
        return {
          kind: 'error',
          message: `Amount mismatch: expected ${expectedPaise} paise, got ${payment.amount}`,
          manualReview: true,
        };
      }

      // ---- Coupon exhaustion atomic re-check inside tx ----
      if (reg.couponCode) {
        let maxUses = 1;
        try {
          const dbCouponRows = await tx.select().from(couponsTable);
          const shaped = dbCouponRows.map((r) => ({
            code: r.code,
            percentOff: r.percentOff,
            maxUses: r.maxUses,
            validFrom: r.validFrom,
            validUntil: r.validUntil,
            minFeeRupees: 1,
          }));
          const m = findCoupon(reg.couponCode, shaped);
          if (m) maxUses = m.maxUses;
        } catch {
          const m = findCoupon(reg.couponCode);
          if (m) maxUses = m.maxUses;
        }
        const used = await getPaidCouponUseCount(reg.couponCode, tx);
        if (used >= maxUses) {
          logWebhook('warn', 'coupon exhausted at webhook verify', {
            ...meta,
            couponCode: reg.couponCode,
            used,
            maxUses,
          });
          return {
            kind: 'error',
            message: 'Coupon exhausted before webhook completed payment',
            manualReview: true,
          };
        }
      }

      // ---- Pending → paid: normal allocation (confirmedCount bumped once) ----
      const assigned = await allocateAloysiusTicket(tx, {
        bumpConfirmed: true,
      });

      const [updated] = await tx
        .update(registrations)
        .set({
          paymentStatus: 'paid',
          paymentId: payment.id,
          orderId: payment.order_id!,
          ticketId: assigned.ticketId,
          bibNumber: assigned.bibNumber,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(registrations.id, reg.id),
            sql`${registrations.paymentStatus} <> 'paid'`
          )
        )
        .returning();

      if (!updated) {
        const reRead = (
          await tx.select().from(registrations).where(eq(registrations.id, reg.id)).limit(1)
        )[0];
        if (reRead && reRead.paymentStatus === 'paid') {
          logWebhook('info', 'webhook concurrent race — resolved', meta);
          return { kind: 'noop', reason: 'concurrent request already applied transition' };
        }
        throw new Error('Webhook concurrent update conflict');
      }

      logWebhook('info', 'webhook confirmed registration', {
        ...meta,
        ticketId: assigned.ticketId,
        bibNumber: assigned.bibNumber,
      });

      return {
        kind: 'confirmed',
        registrationId: reg.id,
        ticketId: assigned.ticketId,
        bibNumber: assigned.bibNumber,
        name: reg.name,
        email: reg.email,
        jerseySize: reg.jerseySize,
        entryType: reg.entryType ?? 'paid',
        eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
      };
    });

    if (result.kind === 'error') {
      logWebhook('error', 'webhook manual review', { message: result.message });
      return NextResponse.json({
        ok: true,
        manualReview: true,
        reason: result.message,
      });
    }

    if (result.kind === 'confirmed') {
      void sendRegistrationConfirmationEmail({
        registrationId: result.registrationId,
        name: result.name,
        email: result.email,
        ticketId: result.ticketId,
        bibNumber: result.bibNumber,
        jerseySize: result.jerseySize,
        entryType: result.entryType,
        eventName: result.eventName,
      }).catch((err) => {
        console.error('[rzp-webhook] async confirmation email failed', {
          registrationId: result.registrationId,
          err: err instanceof Error ? err.message : String(err),
        });
      });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logWebhook('error', 'webhook exception (will be retried by Razorpay)', {
      orderId: payment.order_id,
      paymentId: payment.id,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}
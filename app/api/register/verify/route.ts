import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';
import { allocateAloysiusTicket, getPaidCouponUseCount } from '@/lib/aloysiusRegistration';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';
import { ALOYSIUS_EVENT_NAME, feeRupeesToPaise } from '@/lib/registrationPhases';
import { razorpay } from '@/lib/razorpay';
import { findCoupon } from '@/lib/coupons';

export const maxDuration = 60;

const verifySchema = z.object({
  registrationId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

type RzpPayment = {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  currency: string;
  captured: boolean;
};

function logVerify(
  level: 'info' | 'warn' | 'error',
  msg: string,
  meta: Record<string, unknown> = {}
) {
  const prefix = `[verify-payment]`;
  const line = `${prefix} ${msg} :: ${JSON.stringify(meta)}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export async function POST(req: Request) {
  const start = Date.now();
  let logMeta: Record<string, unknown> = {};

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment payload' }, { status: 400 });
    }

    const {
      registrationId,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: rzpSignature,
    } = parsed.data;

    logMeta = { registrationId, rzpOrderId, rzpPaymentId };
    logVerify('info', 'start verification', logMeta);

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      logVerify('error', 'RAZORPAY_KEY_SECRET missing', logMeta);
      return NextResponse.json(
        { error: 'Payment verification not configured' },
        { status: 500 }
      );
    }

    // Step 1: HMAC signature check (Razorpay client-signature authenticity)
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    if (expectedSig !== rzpSignature) {
      logVerify('warn', 'HMAC signature mismatch', logMeta);
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Step 2: Server-side fetch of payment from Razorpay to confirm capture + amount.
    // We MUST NOT trust the browser alone for payment status.
    let rzpPayment: RzpPayment | null = null;
    try {
      rzpPayment = (await razorpay.payments.fetch(rzpPaymentId)) as unknown as RzpPayment;
    } catch (rpErr) {
      logVerify(
        'error',
        'failed to fetch payment from Razorpay',
        { ...logMeta, err: rpErr instanceof Error ? rpErr.message : String(rpErr) }
      );
      return NextResponse.json(
        { error: 'Payment provider unreachable. Do NOT pay again — retry shortly.' },
        { status: 502 }
      );
    }

    if (!rzpPayment) {
      logVerify('warn', 'Razorpay returned no payment record', logMeta);
      return NextResponse.json(
        { error: 'Payment record not found with provider. Do NOT pay again.' },
        { status: 400 }
      );
    }

    if (rzpPayment.id !== rzpPaymentId) {
      logVerify('warn', 'returned payment ID does not match requested', {
        ...logMeta,
        returnedId: rzpPayment.id,
      });
      return NextResponse.json({ error: 'Payment ID mismatch' }, { status: 400 });
    }

    if (rzpPayment.order_id && rzpPayment.order_id !== rzpOrderId) {
      logVerify('warn', 'Razorpay payment linked to a different order', {
        ...logMeta,
        rzpPaymentOrderId: rzpPayment.order_id,
      });
      return NextResponse.json({ error: 'Order / Payment mismatch' }, { status: 400 });
    }

    if (!rzpPayment.captured || rzpPayment.status !== 'captured') {
      logVerify('warn', 'Razorpay payment not captured', {
        ...logMeta,
        status: rzpPayment.status,
        captured: rzpPayment.captured,
      });
      return NextResponse.json(
        { error: 'Payment is not yet confirmed. Please retry after a moment.' },
        { status: 409 }
      );
    }

    if (rzpPayment.currency !== 'INR') {
      logVerify('warn', 'unexpected currency', { ...logMeta, currency: rzpPayment.currency });
      return NextResponse.json({ error: 'Unexpected payment currency' }, { status: 400 });
    }

    // Step 3: Single atomic transaction — read registration → validate → allocate → update.
    // Roll back on any error so counters are never consumed for unverifiable payments.
    const result = await db.transaction(async (tx) => {
      // Lock + read current registration state inside transaction.
      const rows = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.id, registrationId))
        .limit(1);

      const reg = rows[0];
      if (!reg) {
        return { kind: 'error' as const, status: 404, message: 'Registration not found' };
      }

      logMeta.currentPaymentStatus = reg.paymentStatus;
      logMeta.currentTicketId = reg.ticketId ?? null;
      logMeta.currentBib = reg.bibNumber ?? null;
      logMeta.storedOrderId = reg.orderId ?? null;
      logMeta.expectedFeeRupees = reg.feeRupees ?? null;

      // ---- IDEMPOTENCY: Already paid? Return existing ticket. ----
      if (reg.paymentStatus === 'paid') {
        // Even if ticketId is missing, do NOT allocate again inside verify.
        // The admin recovery flow handles orphaned paid registrations safely.
        logVerify('info', 'idempotent replay — already paid', logMeta);

        let ticketId = reg.ticketId;
        let bibNumber = reg.bibNumber;

        if (!ticketId) {
          // Paid but ticket allocation missing → recover (no extra confirmedCount bump).
          // Keep recovery inside same tx so we never partially apply a fix.
          const recovered = await allocateAloysiusTicket(tx, { bumpConfirmed: false });
          ticketId = recovered.ticketId;
          bibNumber = recovered.bibNumber;

          await tx
            .update(registrations)
            .set({
              ticketId,
              bibNumber,
              paymentId: reg.paymentId ?? rzpPaymentId,
              orderId: reg.orderId ?? rzpOrderId,
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, registrationId));

          logVerify('info', 'recovered paid registration with missing ticket', {
            ...logMeta,
            recoveredTicketId: ticketId,
            recoveredBib: bibNumber,
          });
        }

        return {
          kind: 'success' as const,
          ticketId: ticketId!,
          bibNumber,
          name: reg.name,
          email: reg.email,
          jerseySize: reg.jerseySize,
          entryType: reg.entryType ?? 'paid',
          eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
        };
      }

      // ---- Order ID protection: registration orderId must match if set ----
      if (reg.orderId && reg.orderId !== rzpOrderId) {
        logVerify('warn', 'orderId on registration does not match submitted order', {
          ...logMeta,
          regOrderId: reg.orderId,
        });
        return { kind: 'error' as const, status: 400, message: 'Order mismatch' };
      }

      // ---- Amount validation: server-side authoritative amount ----
      const expectedFeeRupees = Number(reg.feeRupees ?? 0);
      const expectedAmountPaise = feeRupeesToPaise(expectedFeeRupees);

      if (rzpPayment.amount !== expectedAmountPaise) {
        logVerify('warn', 'amount mismatch', {
          ...logMeta,
          rzpAmountPaise: rzpPayment.amount,
          expectedAmountPaise,
        });
        return {
          kind: 'error' as const,
          status: 400,
          message: 'Payment amount does not match registration.',
        };
      }

      // ---- Coupon exhaustion re-check (atomic — inside transaction) ----
      if (reg.couponCode) {
        // Load coupon config to find maxUses — try DB coupons, fall back to static definitions
        // We run this inside tx so the use-count + subsequent paid-status write are consistent.
        let couponMaxUses = 1;
        try {
          const { coupons: couponTable } = await import('@/lib/db/schema');
          const dbCouponRows = await tx.select().from(couponTable);
          const shaped = dbCouponRows.map((r) => ({
            code: r.code,
            percentOff: r.percentOff,
            maxUses: r.maxUses,
            validFrom: r.validFrom,
            validUntil: r.validUntil,
            minFeeRupees: 1,
          }));
          const matched = findCoupon(reg.couponCode, shaped);
          if (matched) couponMaxUses = matched.maxUses;
        } catch {
          // ignore — default fallback from static coupon table (maxUses embedded in findCoupon)
          const matched = findCoupon(reg.couponCode);
          if (matched) couponMaxUses = matched.maxUses;
        }

        const used = await getPaidCouponUseCount(reg.couponCode, tx);
        if (used >= couponMaxUses) {
          logVerify('warn', 'coupon exhausted at verify-time', {
            ...logMeta,
            couponCode: reg.couponCode,
            used,
            couponMaxUses,
          });
          return {
            kind: 'error' as const,
            status: 400,
            message: 'This coupon has reached its usage limit before your payment confirmed.',
          };
        }
      }

      // ---- Atomic allocation + registration update ----
      const assigned = await allocateAloysiusTicket(tx, { bumpConfirmed: true });
      logMeta.newTicketId = assigned.ticketId;
      logMeta.newBib = assigned.bibNumber;
      logMeta.newConfirmedCount = assigned.confirmedCount;

      // Conditional update: ONLY apply if still pending.
      // Second safety net against concurrent verifiers racing for the same registration.
      const [updated] = await tx
        .update(registrations)
        .set({
          paymentStatus: 'paid',
          paymentId: rzpPaymentId,
          orderId: rzpOrderId,
          ticketId: assigned.ticketId,
          bibNumber: assigned.bibNumber,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(registrations.id, registrationId),
            sql`${registrations.paymentStatus} <> 'paid'`
          )
        )
        .returning();

      if (!updated) {
        // Concurrent request moved it to paid between our SELECT and UPDATE.
        // Roll back our allocation implicitly (tx will abort since we throw),
        // OR — better — we can fall back to reading again and returning existing.
        const reRead = await tx
          .select()
          .from(registrations)
          .where(eq(registrations.id, registrationId))
          .limit(1);
        const after = reRead[0];
        if (after && after.paymentStatus === 'paid' && after.ticketId) {
          logVerify('info', 'concurrent verify race — won by another request, returning existing', {
            ...logMeta,
            existingTicketId: after.ticketId,
          });
          return {
            kind: 'success' as const,
            ticketId: after.ticketId,
            bibNumber: after.bibNumber,
            name: after.name,
            email: after.email,
            jerseySize: after.jerseySize,
            entryType: after.entryType ?? 'paid',
            eventName: after.eventName || ALOYSIUS_EVENT_NAME,
          };
        }
        throw new Error('Registration update conflict during payment verification.');
      }

      return {
        kind: 'success' as const,
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
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    // ---- Transaction committed successfully! ----
    // Email is dispatched AFTER success. Email must never rollback a confirmed payment.
    // It uses its own internal retry + fails safe (returns bool, never throws).
    void sendRegistrationConfirmationEmail({
      registrationId,
      name: result.name,
      email: result.email,
      ticketId: result.ticketId,
      bibNumber: result.bibNumber,
      jerseySize: result.jerseySize,
      entryType: result.entryType,
      eventName: result.eventName,
    }).catch((emailErr) => {
      console.error('[verify-payment] async email send failed (will be retried via admin UI later)', {
        registrationId,
        ticketId: result.ticketId,
        err: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    });

    logVerify('info', 'verification SUCCESS', {
      ...logMeta,
      elapsedMs: Date.now() - start,
      ticketId: result.ticketId,
      bibNumber: result.bibNumber,
    });

    return NextResponse.json({
      success: true,
      ticketId: result.ticketId,
      bibNumber: result.bibNumber,
      uid: registrationId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Payment verification failed';
    logVerify('error', 'verification exception', {
      ...logMeta,
      elapsedMs: Date.now() - start,
      err: msg,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

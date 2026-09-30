import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { registrations, coupons as couponsTable } from '@/lib/db/schema';
import { razorpay } from '@/lib/razorpay';
import {
  allocateAloysiusFreeTicket,
  getAloysiusConfirmedCount,
  getPaidCouponUseCount,
} from '@/lib/aloysiusRegistration';
import { getRegistrationAccess } from '@/lib/registrationAccess';
import {
  ALOYSIUS_EVENT_ID,
  ALOYSIUS_EVENT_NAME,
  feeRupeesToPaise,
  getPricingForCount,
  PRICING_TIERS,
} from '@/lib/registrationPhases';
import { applyCoupon, normalizeCouponCode, findCoupon } from '@/lib/coupons';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';

export const maxDuration = 60;

const registrationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  age: z.coerce.number().min(5).max(100),
  gender: z.enum(['Male', 'Female', 'Prefer not to say']),
  city: z.string().min(2),
  emergencyContact: z.string().min(10).max(15),
  source: z.string().min(1),
  jerseySize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  declarationAgreed: z.literal(true),
  couponCode: z.string().max(32).optional().nullable(),
});

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}
function normalizePhone(p: string): string {
  // Strip non-digits so +91-98765-43210 and 9876543210 compare equal.
  return (p ?? '').replace(/\D/g, '');
}

export async function POST(req: Request) {
  try {
    const access = await getRegistrationAccess();
    if (!access.isOpen) {
      return NextResponse.json(
        {
          error: `Registration opens on ${access.scheduledUnlockLabel}.`,
          code: 'REGISTRATION_LOCKED',
          scheduledUnlockAt: access.scheduledUnlockAt,
          scheduledUnlockLabel: access.scheduledUnlockLabel,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const confirmedCount = await getAloysiusConfirmedCount();
    const pricing = getPricingForCount(confirmedCount);

    // ---- Duplicate protection: prevent accidental double-clicks creating paid dupes ----
    // Only block if an already-PAID registration exists with the same email+phone+event.
    // Pending registrations are allowed because: (a) user may legitimately re-try after
    // an abandoned order, and (b) families sharing contact info is allowed via multiple
    // independent pending → paid flows (uniqueness constraints and idempotent verify
    // still prevent double-charging).
    const normEmail = normalizeEmail(data.email);
    const normPhone = normalizePhone(data.phone);
    const existingPaidMatches = await db
      .select({ id: registrations.id, ticketId: registrations.ticketId })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, ALOYSIUS_EVENT_ID),
          eq(registrations.paymentStatus, 'paid'),
          sql`lower(${registrations.email}) = ${normEmail}`,
          sql`regexp_replace(${registrations.phone}, '[^0-9]', '', 'g') = ${normPhone}`
        )
      )
      .limit(1);

    if (existingPaidMatches.length > 0) {
      const hit = existingPaidMatches[0];
      return NextResponse.json(
        {
          error: 'A completed registration already exists for this contact. Check your email or visit the ticket page.',
          code: 'ALREADY_REGISTERED',
          existingRegistrationId: hit.id,
          existingTicketId: hit.ticketId ?? null,
        },
        { status: 409 }
      );
    }

    if (pricing.feeRupees === 0) {
      // ---- FREE TIER: allocation + insert in ONE atomic transaction ----
      // If INSERT fails (constraint violation, DB down, …), counter bumps roll back.
      const freeResult = await db.transaction(async (tx) => {
        const assigned = await allocateAloysiusFreeTicket(tx);
        if (!assigned) {
          return { kind: 'full' as const };
        }

        const [row] = await tx
          .insert(registrations)
          .values({
            name: data.name,
            email: data.email,
            phone: data.phone,
            age: data.age,
            gender: data.gender,
            city: data.city,
            emergencyContact: data.emergencyContact,
            source: data.source,
            jerseySize: data.jerseySize,
            eventId: ALOYSIUS_EVENT_ID,
            eventName: ALOYSIUS_EVENT_NAME,
            entryType: 'free',
            paymentStatus: 'paid',
            paymentId: 'FREE',
            feeRupees: 0,
            pricingPhase: 1,
            pricingTierId: 'phase1-free',
            ticketId: assigned.ticketId,
            bibNumber: assigned.bibNumber,
          })
          .returning();

        return { kind: 'ok' as const, row, assigned };
      });

      if (freeResult.kind === 'full') {
        return NextResponse.json(
          {
            error:
              'Free registration slots just filled. Please refresh and register at the current phase price.',
            code: 'FREE_SLOTS_FULL',
          },
          { status: 409 }
        );
      }

      const { row } = freeResult;

      // Email dispatched AFTER success (never blocks response).
      void sendRegistrationConfirmationEmail({
        registrationId: row.id,
        name: row.name,
        email: row.email,
        ticketId: row.ticketId!,
        bibNumber: row.bibNumber,
        jerseySize: row.jerseySize,
        entryType: row.entryType,
        eventName: row.eventName,
      }).catch((emailErr) => {
        console.error('[register:free] async email send failed', {
          registrationId: row.id,
          err: emailErr instanceof Error ? emailErr.message : String(emailErr),
        });
      });

      return NextResponse.json({
        free: true,
        registrationId: row.id,
        uid: row.id,
        ticketId: row.ticketId,
        bibNumber: row.bibNumber,
        pricing: {
          phase: 1,
          label: 'Phase 1 · Free',
          feeRupees: 0,
          entryType: 'free',
        },
      });
    }

    let feeRupees = pricing.feeRupees;
    let originalFeeRupees: number | null = null;
    let couponCode: string | null = null;

    // When free slots are active (feeRupees = 0), validate the coupon against
    // the first paid tier fee — same logic as validate-coupon route.
    const effectiveFee =
      pricing.feeRupees > 0
        ? pricing.feeRupees
        : (PRICING_TIERS.find((t) => t.feeRupees > 0)?.feeRupees ?? 200);

    const rawCoupon = data.couponCode ? normalizeCouponCode(data.couponCode) : '';
    if (rawCoupon) {
      const paidUseCount = await getPaidCouponUseCount(rawCoupon);
      type DbCouponShape = {
        code: string;
        percentOff: number;
        maxUses: number;
        validFrom: Date | null;
        validUntil: Date | null;
        minFeeRupees: number;
      };
      let dbCouponsList: DbCouponShape[] = [];
      try {
        const dbRows = await db.select().from(couponsTable);
        dbCouponsList = dbRows.map((r): DbCouponShape => ({
          code: r.code,
          percentOff: r.percentOff,
          maxUses: r.maxUses,
          validFrom: r.validFrom,
          validUntil: r.validUntil,
          minFeeRupees: 1,
        }));
      } catch (err) {
        console.error('[register] getDbCoupons failed:', err);
        dbCouponsList = [];
      }
      const couponResult = applyCoupon({
        code: rawCoupon,
        baseFeeRupees: effectiveFee,
        paidUseCount,
        dbCoupons: dbCouponsList,
      });
      if (!couponResult.ok) {
        return NextResponse.json(
          { error: couponResult.error, code: couponResult.code },
          { status: 400 }
        );
      }
      feeRupees = couponResult.feeRupees;
      originalFeeRupees = couponResult.originalFeeRupees;
      couponCode = couponResult.couponCode;
    }

    const amountPaise = feeRupeesToPaise(feeRupees);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `ba_${Date.now()}`,
      notes: {
        eventId: ALOYSIUS_EVENT_ID,
        name: data.name,
        email: data.email,
        phase: String(pricing.phase),
        feeRupees: String(feeRupees),
        ...(couponCode
          ? { couponCode, originalFeeRupees: String(originalFeeRupees ?? pricing.feeRupees) }
          : {}),
      },
    });

    const [row] = await db
      .insert(registrations)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        city: data.city,
        emergencyContact: data.emergencyContact,
        source: data.source,
        jerseySize: data.jerseySize,
        eventId: ALOYSIUS_EVENT_ID,
        eventName: ALOYSIUS_EVENT_NAME,
        entryType: 'paid',
        paymentStatus: 'pending',
        orderId: order.id,
        feeRupees,
        originalFeeRupees,
        couponCode,
        pricingPhase: pricing.phase,
        pricingTierId: pricing.tierId,
      })
      .returning();

    return NextResponse.json({
      free: false,
      registrationId: row.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      pricing: {
        phase: pricing.phase,
        label: pricing.label,
        feeRupees,
        originalFeeRupees: originalFeeRupees ?? undefined,
        couponCode: couponCode ?? undefined,
        entryType: 'paid',
      },
      prefill: {
        name: data.name,
        email: data.email,
        contact: data.phone,
      },
    });
  } catch (error: unknown) {
    console.error('Create registration order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to start registration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';
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
} from '@/lib/registrationPhases';
import { applyCoupon, normalizeCouponCode } from '@/lib/coupons';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';

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

    if (pricing.feeRupees === 0) {
      const assigned = await allocateAloysiusFreeTicket();
      if (!assigned) {
        return NextResponse.json(
          {
            error:
              'Free registration slots just filled. Please refresh and register at the current phase price.',
            code: 'FREE_SLOTS_FULL',
          },
          { status: 409 }
        );
      }

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

      void sendRegistrationConfirmationEmail({
        registrationId: row.id,
        name: row.name,
        email: row.email,
        ticketId: row.ticketId!,
        bibNumber: row.bibNumber,
        jerseySize: row.jerseySize,
        entryType: row.entryType,
        eventName: row.eventName,
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

    const rawCoupon = data.couponCode ? normalizeCouponCode(data.couponCode) : '';
    if (rawCoupon) {
      const paidUseCount = await getPaidCouponUseCount(rawCoupon);
      const couponResult = applyCoupon({
        code: rawCoupon,
        baseFeeRupees: pricing.feeRupees,
        paidUseCount,
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

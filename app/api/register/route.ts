import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';
import { razorpay } from '@/lib/razorpay';
import {
  allocateAloysiusFreeTicket,
  getAloysiusConfirmedCount,
} from '@/lib/aloysiusRegistration';
import {
  ALOYSIUS_EVENT_ID,
  ALOYSIUS_EVENT_NAME,
  feeRupeesToPaise,
  getPricingForCount,
} from '@/lib/registrationPhases';
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
});

export async function POST(req: Request) {
  try {
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

      // Fire-and-forget confirmation email (does not block registration)
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

    const amountPaise = feeRupeesToPaise(pricing.feeRupees);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `ba_${Date.now()}`,
      notes: {
        eventId: ALOYSIUS_EVENT_ID,
        name: data.name,
        email: data.email,
        phase: String(pricing.phase),
        feeRupees: String(pricing.feeRupees),
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
        feeRupees: pricing.feeRupees,
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
        feeRupees: pricing.feeRupees,
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

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';
import { allocateAloysiusTicket } from '@/lib/aloysiusRegistration';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';
import { ALOYSIUS_EVENT_NAME } from '@/lib/registrationPhases';

const verifySchema = z.object({
  registrationId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment payload' }, { status: 400 });
    }

    const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);

    const reg = existing[0];
    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (reg.paymentStatus === 'paid' && reg.ticketId) {
      return NextResponse.json({
        success: true,
        ticketId: reg.ticketId,
        bibNumber: reg.bibNumber,
        uid: registrationId,
      });
    }

    if (reg.orderId && reg.orderId !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 });
    }

    const assigned = await allocateAloysiusTicket();

    await db
      .update(registrations)
      .set({
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        ticketId: assigned.ticketId,
        bibNumber: assigned.bibNumber,
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, registrationId));

    void sendRegistrationConfirmationEmail({
      registrationId,
      name: reg.name,
      email: reg.email,
      ticketId: assigned.ticketId,
      bibNumber: assigned.bibNumber,
      jerseySize: reg.jerseySize,
      entryType: reg.entryType ?? 'paid',
      eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
    });

    return NextResponse.json({
      success: true,
      ticketId: assigned.ticketId,
      bibNumber: assigned.bibNumber,
      uid: registrationId,
    });
  } catch (error: unknown) {
    console.error('Verify registration error:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

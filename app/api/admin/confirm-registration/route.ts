import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { toRegistration } from '@/lib/db/mappers';
import { registrations } from '@/lib/db/schema';
import { allocateAloysiusTicket } from '@/lib/aloysiusRegistration';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';
import { ALOYSIUS_EVENT_NAME } from '@/lib/registrationPhases';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  id: z.string().uuid(),
  /** Razorpay payment id if known (optional for manual confirm) */
  paymentId: z.string().min(1).optional(),
  sendEmail: z.boolean().optional().default(true),
});

/**
 * Admin: confirm a pending paid registration (after Razorpay success without verify callback),
 * allocate ticket/BIB, mark paid, and optionally send confirmation email.
 */
export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { id, paymentId, sendEmail } = parsed.data;

    const rows = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
    const reg = rows[0];
    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    let ticketId = reg.ticketId;
    let bibNumber = reg.bibNumber;

    if (reg.paymentStatus !== 'paid' || !ticketId) {
      const assigned = await allocateAloysiusTicket();
      ticketId = assigned.ticketId;
      bibNumber = assigned.bibNumber;

      await db
        .update(registrations)
        .set({
          paymentStatus: 'paid',
          paymentId: paymentId || reg.paymentId || 'MANUAL_ADMIN_CONFIRM',
          ticketId,
          bibNumber,
          entryType: reg.entryType || 'paid',
          updatedAt: new Date(),
        })
        .where(eq(registrations.id, id));
    }

    let emailOk = false;
    if (sendEmail && ticketId) {
      emailOk = await sendRegistrationConfirmationEmail({
        registrationId: id,
        name: reg.name,
        email: reg.email,
        ticketId,
        bibNumber,
        jerseySize: reg.jerseySize,
        entryType: reg.entryType ?? 'paid',
        eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
      });
    }

    const updated = (
      await db.select().from(registrations).where(eq(registrations.id, id)).limit(1)
    )[0];

    return NextResponse.json({
      success: true,
      emailSent: emailOk,
      registration: updated ? toRegistration(updated) : null,
    });
  } catch (error: unknown) {
    console.error('Admin confirm registration error:', error);
    const message = error instanceof Error ? error.message : 'Failed to confirm registration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

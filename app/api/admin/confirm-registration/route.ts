import { NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { toRegistration } from '@/lib/db/mappers';
import { registrations } from '@/lib/db/schema';
import {
  allocateAloysiusTicket,
  allocateAloysiusTicketRecovery,
} from '@/lib/aloysiusRegistration';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';
import { ALOYSIUS_EVENT_NAME } from '@/lib/registrationPhases';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    // ---- SINGLE ATOMIC TRANSACTION: decide → allocate → update ----
    const txResult = await db.transaction(async (tx) => {
      const rows = await tx.select().from(registrations).where(eq(registrations.id, id)).limit(1);
      const reg = rows[0];
      if (!reg) {
        return { kind: 'error' as const, status: 404, message: 'Registration not found' };
      }

      // Idempotent: already fully confirmed (paid + ticket) → return existing, NO changes.
      if (reg.paymentStatus === 'paid' && reg.ticketId) {
        return {
          kind: 'noop' as const,
          ticketId: reg.ticketId,
          bibNumber: reg.bibNumber,
          name: reg.name,
          email: reg.email,
          jerseySize: reg.jerseySize,
          entryType: reg.entryType ?? 'paid',
          eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
        };
      }

      let ticketId: string | null = reg.ticketId;
      let bibNumber: number | null = reg.bibNumber;
      const wasPaid = reg.paymentStatus === 'paid';

      if (!ticketId) {
        // SAFE RECOVERY:
        // - If ALREADY paid (orphaned paid row from mid-allocation crash): recovery allocator
        //   bumps the ticket counter to fill the gap but DOES NOT increment confirmedCount.
        // - If still pending (normal admin manual confirm): bump BOTH counters.
        const assigned = wasPaid
          ? await allocateAloysiusTicketRecovery(tx)
          : await allocateAloysiusTicket(tx, { bumpConfirmed: true });
        ticketId = assigned.ticketId;
        bibNumber = assigned.bibNumber;
      }

      // Conditional UPDATE with RETURNING — second safety net against concurrent admins.
      const updates: Partial<typeof registrations.$inferInsert> = {
        ticketId,
        bibNumber,
        entryType: reg.entryType || 'paid',
        updatedAt: new Date(),
      };

      if (!wasPaid) {
        // Only transition payment status when moving from pending → paid.
        // Never overwrite a valid paymentId that already exists and is paid.
        updates.paymentStatus = 'paid';
        updates.paymentId = paymentId || reg.paymentId || 'MANUAL_ADMIN_CONFIRM';
      } else if (paymentId && !reg.paymentId) {
        // Was paid but missing paymentId (rare) — fill in the admin-provided one.
        updates.paymentId = paymentId;
      }

      const [updated] = await tx
        .update(registrations)
        .set(updates)
        // Guard: do NOT let a concurrent admin race overwrite a payment-status transition that
        // already completed. The allocation counters above are in this same tx so they roll back
        // if the where-clause returns zero rows and we throw.
        .where(
          wasPaid
            ? eq(registrations.id, id)
            : and(eq(registrations.id, id), sql`${registrations.paymentStatus} <> 'paid'`)
        )
        .returning();

      if (!updated) {
        // Race: re-read to return canonical state.
        const reRead = (
          await tx.select().from(registrations).where(eq(registrations.id, id)).limit(1)
        )[0];
        if (reRead && reRead.paymentStatus === 'paid' && reRead.ticketId) {
          return {
            kind: 'noop' as const,
            ticketId: reRead.ticketId,
            bibNumber: reRead.bibNumber,
            name: reRead.name,
            email: reRead.email,
            jerseySize: reRead.jerseySize,
            entryType: reRead.entryType ?? 'paid',
            eventName: reRead.eventName || ALOYSIUS_EVENT_NAME,
          };
        }
        throw new Error('Concurrent update conflict on admin confirm registration.');
      }

      return {
        kind: 'confirmed' as const,
        ticketId,
        bibNumber,
        name: reg.name,
        email: reg.email,
        jerseySize: reg.jerseySize,
        entryType: reg.entryType ?? 'paid',
        eventName: reg.eventName || ALOYSIUS_EVENT_NAME,
      };
    });

    if (txResult.kind === 'error') {
      return NextResponse.json({ error: txResult.message }, { status: txResult.status });
    }

    // ---- Email dispatched after commit (idempotent check inside the fn itself) ----
    let emailOk = false;
    if (sendEmail && txResult.ticketId) {
      emailOk = await sendRegistrationConfirmationEmail({
        registrationId: id,
        name: txResult.name,
        email: txResult.email,
        ticketId: txResult.ticketId,
        bibNumber: txResult.bibNumber,
        jerseySize: txResult.jerseySize,
        entryType: txResult.entryType,
        eventName: txResult.eventName,
      });
    }

    const finalRow = (
      await db.select().from(registrations).where(eq(registrations.id, id)).limit(1)
    )[0];

    return NextResponse.json({
      success: true,
      emailSent: emailOk,
      noop: txResult.kind === 'noop',
      registration: finalRow ? toRegistration(finalRow) : null,
    });
  } catch (error: unknown) {
    console.error('Admin confirm registration error:', error);
    const message = error instanceof Error ? error.message : 'Failed to confirm registration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

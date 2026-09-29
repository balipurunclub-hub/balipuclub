import { NextResponse } from 'next/server';
import { and, eq, isNull, or, sql, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';

export const maxDuration = 60;

const BATCH_DELAY_MS = 250;

type PendingRow = {
  id: string;
  name: string;
  email: string;
  ticketId: string | null;
  bibNumber: number | null;
  jerseySize: string | null;
  entryType: string | null;
  eventName: string | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows: PendingRow[] = await db
      .select({
        id: registrations.id,
        name: registrations.name,
        email: registrations.email,
        ticketId: registrations.ticketId,
        bibNumber: registrations.bibNumber,
        jerseySize: registrations.jerseySize,
        entryType: registrations.entryType,
        eventName: registrations.eventName,
      })
      .from(registrations)
      .where(
        and(
          sql`${registrations.ticketId} IS NOT NULL`,
          or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free')),
          or(eq(registrations.emailSent, false), isNull(registrations.emailSent))
        )
      )
      .orderBy(desc(registrations.createdAt));

    return NextResponse.json({
      count: rows.length,
      rows,
    });
  } catch (error: unknown) {
    console.error('GET pending-confirmations error:', error);
    return NextResponse.json({ error: 'Failed to load pending emails' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { ids?: string[] } = {};
    try {
      body = (await req.json()) as typeof body;
    } catch {
      body = {};
    }

    let rows: PendingRow[] = [];

    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      rows = await db
        .select({
          id: registrations.id,
          name: registrations.name,
          email: registrations.email,
          ticketId: registrations.ticketId,
          bibNumber: registrations.bibNumber,
          jerseySize: registrations.jerseySize,
          entryType: registrations.entryType,
          eventName: registrations.eventName,
        })
        .from(registrations)
        .where(
          and(
            sql`${registrations.ticketId} IS NOT NULL`,
            or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free')),
            sql`${registrations.id} IN (${body.ids.join(',')})`
          )
        )
        .orderBy(desc(registrations.createdAt));
    } else {
      rows = await db
        .select({
          id: registrations.id,
          name: registrations.name,
          email: registrations.email,
          ticketId: registrations.ticketId,
          bibNumber: registrations.bibNumber,
          jerseySize: registrations.jerseySize,
          entryType: registrations.entryType,
          eventName: registrations.eventName,
        })
        .from(registrations)
        .where(
          and(
            sql`${registrations.ticketId} IS NOT NULL`,
            or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free')),
            or(eq(registrations.emailSent, false), isNull(registrations.emailSent))
          )
        )
        .orderBy(desc(registrations.createdAt));
    }

    const total = rows.length;
    let success = 0;
    let failed = 0;
    const perIdResults: Array<{ id: string; ok: boolean }> = [];

    for (const r of rows) {
      if (!r.ticketId) {
        failed++;
        perIdResults.push({ id: r.id, ok: false });
        continue;
      }
      try {
        const ok = await sendRegistrationConfirmationEmail({
          registrationId: r.id,
          name: r.name,
          email: r.email,
          ticketId: r.ticketId,
          bibNumber: r.bibNumber,
          jerseySize: r.jerseySize,
          entryType: r.entryType,
          eventName: r.eventName,
        });
        if (ok) {
          success++;
          perIdResults.push({ id: r.id, ok: true });
        } else {
          failed++;
          perIdResults.push({ id: r.id, ok: false });
        }
      } catch (e) {
        console.error(`send confirmation error for ${r.id}:`, e);
        failed++;
        perIdResults.push({ id: r.id, ok: false });
      }
      if (BATCH_DELAY_MS > 0) await sleep(BATCH_DELAY_MS);
    }

    return NextResponse.json({
      ok: true,
      total,
      success,
      failed,
      results: perIdResults,
    });
  } catch (error: unknown) {
    console.error('POST pending-confirmations error:', error);
    return NextResponse.json({ error: 'Failed to send pending confirmation emails' }, { status: 500 });
  }
}

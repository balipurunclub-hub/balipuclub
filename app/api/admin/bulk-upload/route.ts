import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { eventCounters, registrations } from '@/lib/db/schema';

async function ensureMonsoonCounter() {
  const id = 'monsoon-run';
  const existing = await db.select().from(eventCounters).where(eq(eventCounters.id, id)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db
    .insert(eventCounters)
    .values({ id, count: 1000, confirmedCount: 0 })
    .onConflictDoNothing()
    .returning();
  return row ?? (await db.select().from(eventCounters).where(eq(eventCounters.id, id)).limit(1))[0];
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [max] = await db
      .select({ bib: registrations.bibNumber })
      .from(registrations)
      .orderBy(desc(registrations.bibNumber))
      .limit(1);

    const maxBib = max?.bib ?? 0;
    return NextResponse.json({ nextBib: maxBib + 1 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { entries, entryType, startBibNumber } = await req.json();

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    await ensureMonsoonCounter();

    const [counter] = await db
      .update(eventCounters)
      .set({
        count: sql`${eventCounters.count} + ${entries.length}`,
        updatedAt: new Date(),
      })
      .where(eq(eventCounters.id, 'monsoon-run'))
      .returning();

    // After bump, tickets are (count - length + 1) .. count
    let currentTicketCount = counter.count - entries.length + 1;
    let currentBib = parseInt(startBibNumber, 10) || 1;

    const results: Array<Record<string, unknown>> = [];
    const failed: Array<{ entry: unknown; reason: string }> = [];

    for (const entry of entries) {
      try {
        const ticketId = `BRC-MR-${currentTicketCount}`;
        const [row] = await db
          .insert(registrations)
          .values({
            name: entry.name || '',
            email: entry.email || '',
            phone: entry.phone || '',
            age: parseInt(entry.age, 10) || 0,
            gender: entry.gender || 'Prefer not to say',
            city: entry.city || '',
            emergencyContact: entry.emergencyContact || '',
            idProofType: entry.idProofType || '',
            idProofNumber: entry.idProofNumber || '',
            source: entry.source || 'Bulk Upload',
            jerseySize: entry.jerseySize || 'N/A',
            paymentStatus: 'paid',
            paymentId: 'bulk_' + Math.random().toString(36).substring(7),
            ticketId,
            bibNumber: currentBib,
            entryType: entryType || 'paid',
            eventId: 'monsoon-run',
            eventName: 'The Monsoon Run',
          })
          .returning();

        results.push({ uid: row.id, ...row });
      } catch (err: unknown) {
        failed.push({
          entry,
          reason: err instanceof Error ? err.message : 'Insert failed',
        });
      }

      currentBib++;
      currentTicketCount++;
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: failed.length,
      results,
      failedEntries: failed,
    });
  } catch (error: unknown) {
    console.error('Bulk upload error:', error);
    const message = error instanceof Error ? error.message : 'Bulk upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

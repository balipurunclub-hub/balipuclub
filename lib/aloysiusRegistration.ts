import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { eventCounters, registrations } from '@/lib/db/schema';
import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';

const COUNTER_DOC = 'balipu-x-aloysius';
const BIB_DOC = 'global-bib';

/** BRC-001, BRC-002, … */
export function formatBrcTicketId(n: number): string {
  return `BRC-${String(n).padStart(3, '0')}`;
}

async function ensureCounter(id: string, defaults: { count: number; confirmedCount: number }) {
  const existing = await db.select().from(eventCounters).where(eq(eventCounters.id, id)).limit(1);
  if (existing.length > 0) return existing[0];

  const [row] = await db
    .insert(eventCounters)
    .values({ id, count: defaults.count, confirmedCount: defaults.confirmedCount })
    .onConflictDoNothing()
    .returning();

  if (row) return row;
  const again = await db.select().from(eventCounters).where(eq(eventCounters.id, id)).limit(1);
  return again[0];
}

/**
 * Ensure Aloysius ticket sequence starts at 0 so first ticket is BRC-001.
 * Migrates legacy default of 1000 when no new-format tickets exist yet.
 */
async function ensureAloysiusTicketCounter() {
  const counter = await ensureCounter(COUNTER_DOC, { count: 0, confirmedCount: 0 });

  const existingTickets = await db
    .select({ ticketId: registrations.ticketId })
    .from(registrations)
    .where(eq(registrations.eventId, ALOYSIUS_EVENT_ID));

  let maxBrc = 0;
  for (const row of existingTickets) {
    const match = row.ticketId?.match(/^BRC-(\d+)$/);
    if (match) {
      maxBrc = Math.max(maxBrc, parseInt(match[1], 10));
    }
  }

  // Legacy counter started at 1000 for BRC-BA-* — reset for BRC-001 sequence
  if (counter.count >= 1000 && maxBrc === 0) {
    await db
      .update(eventCounters)
      .set({ count: 0, updatedAt: new Date() })
      .where(eq(eventCounters.id, COUNTER_DOC));
    return { ...counter, count: 0 };
  }

  if (counter.count < maxBrc) {
    await db
      .update(eventCounters)
      .set({ count: maxBrc, updatedAt: new Date() })
      .where(eq(eventCounters.id, COUNTER_DOC));
    return { ...counter, count: maxBrc };
  }

  return counter;
}

export async function getAloysiusConfirmedCount(): Promise<number> {
  const counter = await ensureCounter(COUNTER_DOC, { count: 0, confirmedCount: 0 });

  if (counter.confirmedCount === 0) {
    const paid = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations)
      .where(
        sql`${registrations.eventId} = ${ALOYSIUS_EVENT_ID} AND ${registrations.paymentStatus} = 'paid'`
      );
    const count = Number(paid[0]?.count ?? 0);
    if (count > 0) {
      await db
        .update(eventCounters)
        .set({ confirmedCount: count, updatedAt: new Date() })
        .where(eq(eventCounters.id, COUNTER_DOC));
      return count;
    }
  }

  return counter.confirmedCount;
}

export type AssignedTicket = {
  ticketId: string;
  bibNumber: number;
  confirmedCount: number;
};

async function bumpBib(): Promise<number> {
  await ensureCounter(BIB_DOC, { count: 0, confirmedCount: 0 });
  const [bibRow] = await db
    .update(eventCounters)
    .set({
      count: sql`${eventCounters.count} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(eventCounters.id, BIB_DOC))
    .returning();
  return bibRow.count;
}

/** Allocate ticket for paid (or any) confirmation → BRC-001, BRC-002, … */
export async function allocateAloysiusTicket(): Promise<AssignedTicket> {
  await ensureAloysiusTicketCounter();

  const [ticketRow] = await db
    .update(eventCounters)
    .set({
      count: sql`${eventCounters.count} + 1`,
      confirmedCount: sql`${eventCounters.confirmedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(eventCounters.id, COUNTER_DOC))
    .returning();

  const bibNumber = await bumpBib();

  return {
    ticketId: formatBrcTicketId(ticketRow.count),
    bibNumber,
    confirmedCount: ticketRow.confirmedCount,
  };
}

/**
 * Allocate only while free slots remain (confirmed_count < 10 before increment).
 * Returns null if free slots are gone.
 */
export async function allocateAloysiusFreeTicket(): Promise<AssignedTicket | null> {
  await ensureAloysiusTicketCounter();

  const [ticketRow] = await db
    .update(eventCounters)
    .set({
      count: sql`${eventCounters.count} + 1`,
      confirmedCount: sql`${eventCounters.confirmedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(sql`${eventCounters.id} = ${COUNTER_DOC} AND ${eventCounters.confirmedCount} < 10`)
    .returning();

  if (!ticketRow) return null;

  const bibNumber = await bumpBib();
  return {
    ticketId: formatBrcTicketId(ticketRow.count),
    bibNumber,
    confirmedCount: ticketRow.confirmedCount,
  };
}

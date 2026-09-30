import { eq, sql } from 'drizzle-orm';
import type { NeonHttpDatabase, NeonTransaction } from 'drizzle-orm/neon-http';
import { db } from '@/lib/db';
import { eventCounters, registrations } from '@/lib/db/schema';
import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';
import type * as schema from '@/lib/db/schema';

// Accept either the global Neon DB singleton OR an active transaction.
// Use a looser structural type at runtime-check sites because Drizzle transaction
// objects share the same structural query-builder surface (select/insert/update/etc).
export type AnyDb = NeonHttpDatabase<typeof schema> | NeonTransaction<any, any>;

function withDb(tx?: AnyDb): AnyDb {
  return tx ?? (db as unknown as AnyDb);
}

export type AssignedTicket = {
  ticketId: string;
  bibNumber: number;
  confirmedCount: number;
};

const COUNTER_DOC = 'balipu-x-aloysius';
const BIB_DOC = 'global-bib';

/** BRC-001, BRC-002, … */
export function formatBrcTicketId(n: number): string {
  return `BRC-${String(n).padStart(3, '0')}`;
}

async function ensureCounter(
  id: string,
  defaults: { count: number; confirmedCount: number },
  tx?: AnyDb
) {
  const d = withDb(tx);
  const existing = await d.select().from(eventCounters).where(eq(eventCounters.id, id)).limit(1);
  if (existing.length > 0) return existing[0];

  const [row] = await d
    .insert(eventCounters)
    .values({ id, count: defaults.count, confirmedCount: defaults.confirmedCount })
    .onConflictDoNothing()
    .returning();

  if (row) return row;
  const again = await d.select().from(eventCounters).where(eq(eventCounters.id, id)).limit(1);
  return again[0];
}

/**
 * Ensure Aloysius ticket sequence starts at 0 so first ticket is BRC-001.
 * Migrates legacy default of 1000 when no new-format tickets exist yet.
 */
async function ensureAloysiusTicketCounter(tx?: AnyDb) {
  const counter = await ensureCounter(COUNTER_DOC, { count: 0, confirmedCount: 0 }, tx);
  const d = withDb(tx);
  const existingTickets = await d
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
    await d
      .update(eventCounters)
      .set({ count: 0, updatedAt: new Date() })
      .where(eq(eventCounters.id, COUNTER_DOC));
    return { ...counter, count: 0 };
  }

  if (counter.count < maxBrc) {
    await d
      .update(eventCounters)
      .set({ count: maxBrc, updatedAt: new Date() })
      .where(eq(eventCounters.id, COUNTER_DOC));
    return { ...counter, count: maxBrc };
  }

  return counter;
}

export async function getAloysiusConfirmedCount(tx?: AnyDb): Promise<number> {
  const counter = await ensureCounter(COUNTER_DOC, { count: 0, confirmedCount: 0 }, tx);
  const d = withDb(tx);

  if (counter.confirmedCount === 0) {
    const paid = await d
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations)
      .where(
        sql`${registrations.eventId} = ${ALOYSIUS_EVENT_ID} AND ${registrations.paymentStatus} = 'paid'`
      );
    const count = Number(paid[0]?.count ?? 0);
    if (count > 0) {
      await d
        .update(eventCounters)
        .set({ confirmedCount: count, updatedAt: new Date() })
        .where(eq(eventCounters.id, COUNTER_DOC));
      return count;
    }
  }

  return counter.confirmedCount;
}

/** Count successful paid redemptions of a coupon for Aloysius. Accepts tx for atomicity. */
export async function getPaidCouponUseCount(
  couponCode: string,
  tx?: AnyDb
): Promise<number> {
  const normalized = couponCode.trim().toUpperCase();
  const d = withDb(tx);
  const rows = await d
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      sql`${registrations.eventId} = ${ALOYSIUS_EVENT_ID}
        AND ${registrations.paymentStatus} = 'paid'
        AND upper(${registrations.couponCode}) = ${normalized}`
    );
  return Number(rows[0]?.count ?? 0);
}

async function bumpBib(tx?: AnyDb): Promise<number> {
  await ensureCounter(BIB_DOC, { count: 0, confirmedCount: 0 }, tx);
  const d = withDb(tx);
  const [bibRow] = await d
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
export async function allocateAloysiusTicket(
  tx?: AnyDb,
  opts?: { bumpConfirmed?: boolean }
): Promise<AssignedTicket> {
  const bumpConfirmed = opts?.bumpConfirmed ?? true;
  await ensureAloysiusTicketCounter(tx);
  const d = withDb(tx);

  const [ticketRow] = await d
    .update(eventCounters)
    .set({
      count: sql`${eventCounters.count} + 1`,
      confirmedCount: bumpConfirmed
        ? sql`${eventCounters.confirmedCount} + 1`
        : eventCounters.confirmedCount,
      updatedAt: new Date(),
    })
    .where(eq(eventCounters.id, COUNTER_DOC))
    .returning();

  const bibNumber = await bumpBib(tx);

  return {
    ticketId: formatBrcTicketId(ticketRow.count),
    bibNumber,
    confirmedCount: ticketRow.confirmedCount,
  };
}

/**
 * Recovery: assign ticket/BIB WITHOUT bumping confirmedCount.
 * Used when a registration is ALREADY marked paid but ticket allocation somehow failed.
 * confirmedCount should only be incremented once per registration (when transitioning pending → paid).
 */
export async function allocateAloysiusTicketRecovery(tx?: AnyDb): Promise<AssignedTicket> {
  return allocateAloysiusTicket(tx, { bumpConfirmed: false });
}

/**
 * Allocate only while free slots remain (confirmed_count < 10 before increment).
 * Returns null if free slots are gone.
 */
export async function allocateAloysiusFreeTicket(tx?: AnyDb): Promise<AssignedTicket | null> {
  await ensureAloysiusTicketCounter(tx);
  const d = withDb(tx);

  const [ticketRow] = await d
    .update(eventCounters)
    .set({
      count: sql`${eventCounters.count} + 1`,
      confirmedCount: sql`${eventCounters.confirmedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(sql`${eventCounters.id} = ${COUNTER_DOC} AND ${eventCounters.confirmedCount} < 10`)
    .returning();

  if (!ticketRow) return null;

  const bibNumber = await bumpBib(tx);
  return {
    ticketId: formatBrcTicketId(ticketRow.count),
    bibNumber,
    confirmedCount: ticketRow.confirmedCount,
  };
}

import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { eventCounters, registrations } from '../lib/db/schema';

async function main() {
  const deleted = await db.delete(registrations).returning({ id: registrations.id });

  await db
    .insert(eventCounters)
    .values([
      { id: 'balipu-x-aloysius', count: 0, confirmedCount: 0, updatedAt: new Date() },
      { id: 'global-bib', count: 0, confirmedCount: 0, updatedAt: new Date() },
    ])
    .onConflictDoUpdate({
      target: eventCounters.id,
      set: {
        count: 0,
        confirmedCount: 0,
        updatedAt: new Date(),
      },
    });

  const remaining = await db.select({ count: sql<number>`count(*)::int` }).from(registrations);

  console.log(`Deleted ${deleted.length} registration(s).`);
  console.log(`Registrations remaining: ${remaining[0]?.count ?? 0}`);
  console.log('Reset counters: balipu-x-aloysius + global-bib → 0');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

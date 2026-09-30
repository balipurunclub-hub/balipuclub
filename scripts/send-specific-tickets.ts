/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { registrations } from '@/lib/db/schema';
import { eq, inArray, and, sql } from 'drizzle-orm';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  const TICKET_IDS = [
    'BRC-168',
    'BRC-154',
    'BRC-144',
    'BRC-135',
    'BRC-112',
    'BRC-110',
  ];

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  const rows = await db
    .select()
    .from(registrations)
    .where(
      and(
        inArray(registrations.ticketId, TICKET_IDS),
        sql`${registrations.ticketId} IS NOT NULL`
      )
    );

  console.log(`\n=== SENDING TO ${rows.length} SPECIFIC TICKETS ===\n`);

  const byTicket = new Map(rows.map((r) => [r.ticketId!, r]));
  const ordered = TICKET_IDS.map((tid) => byTicket.get(tid)).filter(Boolean) as typeof rows;

  let sent = 0;
  let failed = 0;
  const delayMs = 1000;

  for (let i = 0; i < ordered.length; i++) {
    const r = ordered[i];
    const seq = i + 1;
    process.stdout.write(`[${seq}/${ordered.length}] ${r.ticketId} (BIB ${r.bibNumber ?? 'N/A'}) ${r.name} <${r.email}> → `);
    try {
      const ok = await sendRegistrationConfirmationEmail({
        registrationId: r.id,
        name: r.name,
        email: r.email,
        ticketId: r.ticketId!,
        bibNumber: r.bibNumber,
        jerseySize: r.jerseySize,
        entryType: r.entryType,
        eventName: r.eventName ?? undefined,
      });
      if (!ok) throw new Error('sendRegistrationConfirmationEmail returned false');
      console.log('OK');
      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('FAILED —', msg);
      failed++;
    }
    if (delayMs > 0 && i < ordered.length - 1) await sleep(delayMs);
  }

  console.log(`\n=== FINAL REPORT ===`);
  console.log(`Sent:   ${sent}/${ordered.length}`);
  console.log(`Failed: ${failed}`);
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { registrations } from '@/lib/db/schema';
import { eq, and, isNull, or, sql, desc } from 'drizzle-orm';

type UnsentTicketRow = {
  id: string;
  ticketId: string | null;
  bibNumber: number | null;
  name: string;
  email: string;
  phone: string;
  entryType: string | null;
  paymentStatus: string;
  feeRupees: number | null;
  couponCode: string | null;
  emailSent: boolean | null;
  eventName: string | null;
  createdAt: Date | string | null;
};

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

  console.log('\n==================================================');
  console.log('  CONFIRMED TICKETS WITHOUT CONFIRMATION EMAIL');
  console.log('==================================================\n');

  const rows: UnsentTicketRow[] = await db
    .select({
      id: registrations.id,
      ticketId: registrations.ticketId,
      bibNumber: registrations.bibNumber,
      name: registrations.name,
      email: registrations.email,
      phone: registrations.phone,
      entryType: registrations.entryType,
      paymentStatus: registrations.paymentStatus,
      feeRupees: registrations.feeRupees,
      couponCode: registrations.couponCode,
      emailSent: registrations.emailSent,
      eventName: registrations.eventName,
      createdAt: registrations.createdAt,
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

  const totalConfirmedRaw = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      and(
        sql`${registrations.ticketId} IS NOT NULL`,
        or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free'))
      )
    );

  const totalConfirmed = totalConfirmedRaw[0]?.count ?? 0;
  const unsentCount = rows.length;
  const sentCount = totalConfirmed - unsentCount;

  console.log(`SUMMARY:`);
  console.log(`  Total confirmed tickets: ${totalConfirmed}`);
  console.log(`  Emails sent successfully: ${sentCount}  (${totalConfirmed > 0 ? ((sentCount / totalConfirmed) * 100).toFixed(1) : '0.0'}%)`);
  console.log(`  Emails NOT sent:          ${unsentCount}  (${totalConfirmed > 0 ? ((unsentCount / totalConfirmed) * 100).toFixed(1) : '0.0'}%)`);
  console.log();

  if (rows.length === 0) {
    console.log('All confirmed tickets have received their confirmation email.');
    console.log();
    return;
  }

  console.log(`DETAILS - ${rows.length} ticket(s) without email:\n`);

  console.log(
    ''.padEnd(8, ' ') +
      'TICKET'.padEnd(12, ' ') +
      'BIB'.padEnd(6, ' ') +
      'TYPE'.padEnd(8, ' ') +
      'NAME'.padEnd(22, ' ') +
      'EMAIL'.padEnd(32, ' ') +
      'FEE'.padEnd(8, ' ') +
      'CREATED'
  );
  console.log('-'.repeat(110));

  rows.forEach((r, i) => {
    const idx = String(i + 1).padStart(3, ' ') + '.';
    const ticket = (r.ticketId ?? 'N/A').padEnd(12, ' ');
    const bib = (r.bibNumber ? String(r.bibNumber) : 'N/A').padEnd(6, ' ');
    const type = ((r.entryType ?? 'paid') === 'free' ? 'FREE' : 'PAID').padEnd(8, ' ');
    const name = r.name.padEnd(22, ' ').slice(0, 22);
    const email = r.email.padEnd(32, ' ').slice(0, 32);
    const fee = (r.feeRupees !== null && r.feeRupees !== undefined ? '₹' + r.feeRupees : 'N/A').padEnd(8, ' ');
    const created = r.createdAt
      ? new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      : 'N/A';
    console.log(`${idx} ${ticket} ${bib} ${type} ${name} ${email} ${fee} ${created}`);
  });

  console.log();
  console.log('DETAILED CONTACT INFORMATION:\n');

  rows.forEach((r, i) => {
    const idx = String(i + 1).padStart(3, ' ');
    console.log(`${idx}. ${r.ticketId}  BIB ${r.bibNumber ?? 'N/A'}`);
    console.log(`    Name:    ${r.name}`);
    console.log(`    Email:   ${r.email}`);
    console.log(`    Phone:   ${r.phone}`);
    console.log(`    Type:    ${r.entryType ?? 'paid'}  |  Fee: ${r.feeRupees !== null ? '₹' + r.feeRupees : 'N/A'}  |  Coupon: ${r.couponCode ?? 'N/A'}`);
    console.log(`    Event:   ${r.eventName ?? 'N/A'}`);
    console.log(`    Created: ${r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}`);
    console.log();
  });

  const emailsOnly = rows.map((r) => r.email).join('\n');
  console.log('EMAILS ONLY (copy-paste list):\n');
  console.log(emailsOnly);
  console.log();

  console.log('To send emails to these registrants:');
  console.log('  npx tsx scripts/send-ticket-emails.ts --all-no-email');
  console.log();
  console.log('Dry-run preview:');
  console.log('  npx tsx scripts/send-ticket-emails.ts --all-no-email --dry-run');
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL ERROR:', e);
  process.exit(1);
});

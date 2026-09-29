/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { registrations } from '@/lib/db/schema';
import { eq, and, sql, or, asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const DEFAULT_COUNTRY_CODE = '91';

type ConfirmedRow = typeof registrations.$inferSelect;

function normalizePhone(raw: string): { phoneDigitsOnly: string; whatsappPhone: string } {
  let digits = (raw ?? '').replace(/\D/g, '');
  const clean = digits;
  if (!digits) return { phoneDigitsOnly: '', whatsappPhone: '' };
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;
  if (!/^\d{10,15}$/.test(digits)) return { phoneDigitsOnly: clean, whatsappPhone: '' };
  return { phoneDigitsOnly: clean, whatsappPhone: `+${digits}` };
}

function isoDate(v: unknown): string {
  if (v == null) return '';
  try { return new Date(v as string | Date).toISOString(); } catch { return String(v); }
}

function escapeCsv(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function excelText(val: unknown): string {
  if (val == null || val === '') return '';
  const s = String(val).replace(/"/g, '""');
  return `="${s}"`;
}

const TEXT_COLUMNS = new Set([
  'bibNumber',
  'phone',
  'phoneDigitsOnly',
  'whatsappPhone',
  'age',
  'emergencyContact',
  'idProofNumber',
  'feeRupees',
  'originalFeeRupees',
  'discountRupees',
  'orderId',
  'paymentId',
  'pricingTierId',
  'registrationId',
  'linkedDocId',
]);

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

  console.log('\nFetching all confirmed tickets...');

  const rows: ConfirmedRow[] = await db
    .select()
    .from(registrations)
    .where(
      and(
        sql`${registrations.ticketId} IS NOT NULL`,
        or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free'))
      )
    )
    .orderBy(asc(registrations.bibNumber), asc(registrations.ticketId));

  console.log(`Found ${rows.length} confirmed tickets.\n`);

  const headers = [
    'seq',
    'ticketId',
    'bibNumber',
    'name',
    'email',
    'phone',
    'phoneDigitsOnly',
    'whatsappPhone',
    'age',
    'gender',
    'city',
    'emergencyContact',
    'idProofType',
    'idProofNumber',
    'source',
    'jerseySize',
    'entryType',
    'entryLabel',
    'feeRupees',
    'originalFeeRupees',
    'discountRupees',
    'couponCode',
    'paymentStatus',
    'orderId',
    'paymentId',
    'pricingPhase',
    'pricingTierId',
    'eventId',
    'eventName',
    'emailSent',
    'attended',
    'attendedAt',
    'linkedDocId',
    'registrationId',
    'createdAt',
    'updatedAt',
  ];

  const lines: string[] = [headers.join(',')];
  let validWA = 0;

  rows.forEach((r, idx) => {
    const p = normalizePhone(r.phone ?? '');
    if (p.whatsappPhone) validWA++;

    const fee = r.feeRupees ?? 0;
    const origFee = r.originalFeeRupees ?? fee;

    lines.push(headers.map((h) => {
      switch (h) {
        case 'seq': return idx + 1;
        case 'ticketId': return r.ticketId;
        case 'bibNumber': return r.bibNumber;
        case 'name': return r.name;
        case 'email': return r.email;
        case 'phone': return r.phone;
        case 'phoneDigitsOnly': return p.phoneDigitsOnly;
        case 'whatsappPhone': return p.whatsappPhone;
        case 'age': return r.age;
        case 'gender': return r.gender;
        case 'city': return r.city;
        case 'emergencyContact': return r.emergencyContact;
        case 'idProofType': return r.idProofType;
        case 'idProofNumber': return r.idProofNumber;
        case 'source': return r.source;
        case 'jerseySize': return r.jerseySize;
        case 'entryType': return r.entryType;
        case 'entryLabel': return r.entryType === 'free' ? 'FREE ENTRY' : 'PAID ENTRY';
        case 'feeRupees': return r.feeRupees;
        case 'originalFeeRupees': return r.originalFeeRupees;
        case 'discountRupees': return origFee - fee;
        case 'couponCode': return r.couponCode;
        case 'paymentStatus': return r.paymentStatus;
        case 'orderId': return r.orderId;
        case 'paymentId': return r.paymentId;
        case 'pricingPhase': return r.pricingPhase;
        case 'pricingTierId': return r.pricingTierId;
        case 'eventId': return r.eventId;
        case 'eventName': return r.eventName;
        case 'emailSent': return r.emailSent ? 'true' : 'false';
        case 'attended': return r.attended ? 'true' : 'false';
        case 'attendedAt': return isoDate(r.attendedAt);
        case 'linkedDocId': return r.linkedDocId;
        case 'registrationId': return r.id;
        case 'createdAt': return isoDate(r.createdAt);
        case 'updatedAt': return isoDate(r.updatedAt);
        default: return '';
      }
    }).map((val, ci) => (TEXT_COLUMNS.has(headers[ci]) ? excelText(val) : escapeCsv(val))).join(','));
  });

  const outDir = path.resolve('exports');
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `confirmed-tickets-all-details-${stamp}.csv`);

  fs.writeFileSync(outPath, '\ufeff' + lines.join('\n'), 'utf8');

  console.log(`====================================================`);
  console.log(` EXPORT COMPLETE`);
  console.log(`====================================================`);
  console.log(` Total confirmed tickets: ${rows.length}`);
  console.log(` With valid WhatsApp (+91): ${validWA}`);
  console.log(` Total columns per row:   ${headers.length}`);
  console.log(` Rows written:            ${rows.length}`);
  console.log(` File:                    ${outPath}`);
  console.log(`====================================================\n`);
  console.log(`Columns included (${headers.length}):`);
  headers.forEach((h, i) => console.log(`  ${String(i + 1).padStart(2)}. ${h}`));
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

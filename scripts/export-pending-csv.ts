/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { registrations } from '@/lib/db/schema';
import { eq, and, isNull, or, sql, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const DEFAULT_COUNTRY_CODE = '91';

type Row = typeof registrations.$inferSelect;

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

const HEADERS = [
  'seq',
  'category',
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

function buildRow(r: Row, idx: number, category: string): string {
  const p = normalizePhone(r.phone ?? '');
  const fee = r.feeRupees ?? 0;
  const origFee = r.originalFeeRupees ?? fee;
  return HEADERS.map((h) => {
    switch (h) {
      case 'seq': return idx;
      case 'category': return category;
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
  }).map((val, ci) => (TEXT_COLUMNS.has(HEADERS[ci]) ? excelText(val) : escapeCsv(val))).join(',');
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  console.log('\n==================================================');
  console.log('  EXPORT PENDING REGISTRATIONS TO CSV');
  console.log('==================================================\n');

  console.log('Fetching Category A: Confirmed tickets WITHOUT confirmation email...');
  const categoryA: Row[] = await db
    .select()
    .from(registrations)
    .where(
      and(
        sql`${registrations.ticketId} IS NOT NULL`,
        or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free')),
        or(eq(registrations.emailSent, false), isNull(registrations.emailSent))
      )
    )
    .orderBy(desc(registrations.createdAt));

  console.log(`  → Found ${categoryA.length} rows.\n`);

  console.log('Fetching Category B: Payment-pending registrations (not paid yet)...');
  const categoryB: Row[] = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.paymentStatus, 'pending'),
        or(eq(registrations.entryType, 'paid'), isNull(registrations.entryType))
      )
    )
    .orderBy(desc(registrations.createdAt));

  console.log(`  → Found ${categoryB.length} rows.\n`);

  const lines: string[] = [HEADERS.join(',')];
  let seq = 1;

  console.log('Building CSV rows...');
  categoryA.forEach((r) => {
    lines.push(buildRow(r, seq++, 'A: CONFIRMED / NO EMAIL'));
  });
  categoryB.forEach((r) => {
    lines.push(buildRow(r, seq++, 'B: PAYMENT PENDING'));
  });

  const totalRows = categoryA.length + categoryB.length;
  const validWAA = categoryA.filter((r) => normalizePhone(r.phone ?? '').whatsappPhone).length;
  const validWAB = categoryB.filter((r) => normalizePhone(r.phone ?? '').whatsappPhone).length;
  const totalValidWA = validWAA + validWAB;

  const totalFeesB = categoryB.reduce((s, r) => s + (r.feeRupees ?? 0), 0);

  const outDir = path.resolve('exports');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `pending-registrations-${stamp}.csv`);

  fs.writeFileSync(outPath, '\ufeff' + lines.join('\n'), 'utf8');

  console.log('\n====================================================');
  console.log(' EXPORT COMPLETE');
  console.log('====================================================');
  console.log(` Category A — Confirmed tickets, NO email sent:  ${categoryA.length}`);
  console.log(`   └─ Valid WhatsApp (+91):                      ${validWAA}`);
  console.log(` Category B — Payment-pending (need to pay):     ${categoryB.length}`);
  console.log(`   └─ Valid WhatsApp (+91):                      ${validWAB}`);
  console.log(`   └─ Sum of fees to collect:                    ₹${totalFeesB}`);
  console.log('────────────────────────────────────────────────────');
  console.log(` TOTAL pending rows exported:                    ${totalRows}`);
  console.log(` Total with valid WhatsApp:                      ${totalValidWA}`);
  console.log(` Columns per row:                                ${HEADERS.length}`);
  console.log(` File:                                           ${outPath}`);
  console.log('====================================================\n');
  console.log('CATEGORY LEGEND:');
  console.log('  A: CONFIRMED / NO EMAIL  →  Paid/free + has ticketId, but confirmation email not yet sent.');
  console.log('  B: PAYMENT PENDING       →  Started registration but payment not completed (chase for payment).');
  console.log();
  console.log('To send emails to Category A:');
  console.log('  npx tsx scripts/send-ticket-emails.ts --all-no-email');
  console.log();
  console.log('Columns included:');
  HEADERS.forEach((h, i) => console.log(`  ${String(i + 1).padStart(2)}. ${h}`));
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

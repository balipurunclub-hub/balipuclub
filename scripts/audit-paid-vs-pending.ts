/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { registrations } from '@/lib/db/schema';
import { sql, asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const DEFAULT_COUNTRY_CODE = '91';

function normalizePhone(raw: string): { whatsappPhone: string; valid: boolean } {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return { whatsappPhone: '', valid: false };
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;
  if (!/^\d{10,15}$/.test(digits)) return { whatsappPhone: '', valid: false };
  return { whatsappPhone: `+${digits}`, valid: true };
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

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  const all = await db
    .select()
    .from(registrations)
    .orderBy(asc(registrations.createdAt));

  console.log('\n');
  console.log('='.repeat(64));
  console.log('  REGISTRATION AUDIT — PAID vs PENDING vs FAILED vs FREE');
  console.log('='.repeat(64));
  console.log(`\n  Total rows in DB:          ${all.length}`);
  console.log(`  Rows with ticketId (confirmed):  ${all.filter((r) => r.ticketId).length}`);
  console.log(`  Rows without ticketId (unconfirmed):  ${all.filter((r) => !r.ticketId).length}\n`);

  const buckets: Record<string, typeof all> = {};
  for (const r of all) {
    const k = `${String(r.entryType ?? '?')}__${String(r.paymentStatus ?? '?')}__${r.ticketId ? 'TICKETED' : 'NO_TICKET'}`;
    (buckets[k] ||= []).push(r);
  }
  const bucketKeys = Object.keys(buckets).sort();
  const bucketCounts = bucketKeys.map((k) => ({ k, n: buckets[k].length, fees: buckets[k].reduce((s, r) => s + (r.feeRupees ?? 0), 0) }));
  const totalFeesAll = all.reduce((s, r) => s + (r.feeRupees ?? 0), 0);

  console.log('Breakdown by entryType × paymentStatus × ticketId:');
  console.log('-'.repeat(64));
  console.log(`${'Bucket'.padEnd(48)}  ${'Count'.padStart(6)}  ${'Fees ₹'.padStart(10)}`);
  console.log('-'.repeat(64));
  for (const b of bucketCounts) {
    const human = b.k.replace(/__/g, '  |  ').padEnd(48).slice(0, 48);
    console.log(`${human}  ${String(b.n).padStart(6)}  ₹${String(b.fees).padStart(9)}`);
  }
  console.log('-'.repeat(64));
  console.log(`${'TOTAL'.padEnd(48)}  ${String(all.length).padStart(6)}  ₹${String(totalFeesAll).padStart(9)}`);
  console.log();

  const pendingPaidAll = all.filter((r) => (r.entryType ?? 'paid') === 'paid' && r.paymentStatus === 'pending');
  const pendingPaidTicketed = pendingPaidAll.filter((r) => r.ticketId);
  const pendingPaidNoTicket = pendingPaidAll.filter((r) => !r.ticketId);
  const pendingPaidFees = pendingPaidAll.reduce((s, r) => s + (r.feeRupees ?? 0), 0);

  console.log('='.repeat(64));
  console.log('  FOCUS: entryType=paid  ×  paymentStatus=pending');
  console.log('='.repeat(64));
  console.log(`  Total such rows:        ${pendingPaidAll.length}`);
  console.log(`    WITH ticketId assigned:  ${pendingPaidTicketed.length}   ⚠️  anomaly (payment pending but confirmed?)`);
  console.log(`    NO ticketId (unconfirmed):  ${pendingPaidNoTicket.length}   (normal — they haven't paid yet)`);
  console.log(`  Sum of feeRupees for pending-paid:  ₹${pendingPaidFees}`);
  console.log();

  if (pendingPaidTicketed.length) {
    console.log('⚠️  PENDING-BUT-CONFIRMED (ticketId assigned + payment=pending, entryType=paid):');
    console.log('-'.repeat(64));
    pendingPaidTicketed.forEach((r, i) => {
      const p = normalizePhone(r.phone ?? '');
      console.log(`  ${String(i + 1).padStart(3)}. ${String(r.ticketId).padEnd(9)}  BIB ${String(r.bibNumber ?? '-').padEnd(5)}  ${r.name.padEnd(25).slice(0, 25)}  ₹${String(r.feeRupees ?? 0).padEnd(4)}  ${p.whatsappPhone || r.phone}  created ${isoDate(r.createdAt).slice(5, 16)}`);
    });
    console.log();
  }

  if (pendingPaidNoTicket.length) {
    console.log('📋 PENDING-UNCONFIRMED (no ticket yet — need to chase payment):');
    console.log('-'.repeat(64));
    pendingPaidNoTicket.slice(0, 25).forEach((r, i) => {
      const p = normalizePhone(r.phone ?? '');
      console.log(`  ${String(i + 1).padStart(3)}. ID ${String(r.id).slice(0, 8)}...  ${r.name.padEnd(25).slice(0, 25)}  ₹${String(r.feeRupees ?? 0).padEnd(4)}  ${p.whatsappPhone || r.phone}  created ${isoDate(r.createdAt).slice(5, 16)}`);
    });
    if (pendingPaidNoTicket.length > 25) console.log(`  ... (+${pendingPaidNoTicket.length - 25} more — see CSV export)`);
    console.log();
  }

  const outDir = path.resolve('exports');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `pending-paid-audit-${stamp}.csv`);

  const headers = [
    'bucket',
    'hasTicketId',
    'entryType',
    'paymentStatus',
    'ticketId',
    'bibNumber',
    'name',
    'age',
    'gender',
    'city',
    'phone',
    'whatsappPhone',
    'email',
    'jerseySize',
    'feeRupees',
    'originalFeeRupees',
    'couponCode',
    'orderId',
    'createdAt',
    'updatedAt',
  ];
  const TEXT_COLS = new Set(['bibNumber', 'phone', 'whatsappPhone', 'feeRupees', 'originalFeeRupees', 'orderId']);

  const lines = [headers.join(',')];
  const pendingForCsv = pendingPaidAll.slice().sort((a, b) => {
    const ta = a.ticketId ? 0 : 1;
    const tb = b.ticketId ? 0 : 1;
    if (ta !== tb) return ta - tb;
    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
  });
  for (const r of pendingForCsv) {
    const p = normalizePhone(r.phone ?? '');
    const row = {
      bucket: (r.ticketId ? 'PENDING_BUT_CONFIRMED' : 'PENDING_UNCONFIRMED'),
      hasTicketId: r.ticketId ? 'YES' : 'NO',
      entryType: r.entryType ?? 'paid',
      paymentStatus: r.paymentStatus,
      ticketId: r.ticketId ?? '',
      bibNumber: r.bibNumber ?? '',
      name: r.name,
      age: r.age ?? '',
      gender: r.gender,
      city: r.city,
      phone: r.phone,
      whatsappPhone: p.whatsappPhone,
      email: r.email,
      jerseySize: r.jerseySize,
      feeRupees: r.feeRupees ?? '',
      originalFeeRupees: r.originalFeeRupees ?? r.feeRupees ?? '',
      couponCode: r.couponCode ?? '',
      orderId: r.orderId ?? '',
      createdAt: isoDate(r.createdAt),
      updatedAt: isoDate(r.updatedAt),
    };
    lines.push(headers.map((h) => (TEXT_COLS.has(h) ? excelText((row as any)[h]) : escapeCsv((row as any)[h]))).join(','));
  }
  fs.writeFileSync(outPath, '\ufeff' + lines.join('\n'), 'utf8');

  console.log(`✅ Audit CSV written: ${outPath}   (${pendingForCsv.length} rows)\n`);

  // Quick summary table
  console.log('='.repeat(64));
  console.log('  QUICK ANSWER SUMMARY');
  console.log('='.repeat(64));
  const paidPaid = all.filter((r) => (r.entryType ?? 'paid') === 'paid' && r.paymentStatus === 'paid').length;
  const freeAll = all.filter((r) => r.entryType === 'free').length;
  const freeConfirmed = all.filter((r) => r.entryType === 'free' && r.ticketId).length;
  const pendingAll = all.filter((r) => r.paymentStatus === 'pending').length;
  const failedAll = all.filter((r) => r.paymentStatus === 'failed').length;
  console.log(`  Total PAID & CONFIRMED (entry=paid, status=paid):    ${paidPaid}`);
  console.log(`  Total FREE (entry=free — confirmed + unconfirmed):   ${freeAll}   (confirmed: ${freeConfirmed})`);
  console.log(`  Total PENDING (paymentStatus=pending, all types):    ${pendingAll}`);
  console.log(`    └── PENDING but paid-entry type:                   ${pendingPaidAll.length}   → ₹${pendingPaidFees} still to collect`);
  console.log(`         └── confirmed (has ticketId):                 ${pendingPaidTicketed.length}   ⚠️  review these`);
  console.log(`         └── unconfirmed (no ticketId):                ${pendingPaidNoTicket.length}`);
  console.log(`  Total FAILED (paymentStatus=failed):                 ${failedAll}`);
  console.log('='.repeat(64));
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

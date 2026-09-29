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

type ConfirmedRow = {
  id: string;
  ticketId: string | null;
  bibNumber: number | null;
  name: string;
  email: string;
  phone: string;
  jerseySize: string | null;
  entryType: string | null;
  feeRupees: number | null;
};

function normalizePhone(raw: string): { clean: string; whatsapp: string } {
  let digits = (raw ?? '').replace(/\D/g, '');
  const clean = digits;
  if (!digits) return { clean: '', whatsapp: '' };
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;
  if (!/^\d{10,15}$/.test(digits)) return { clean, whatsapp: '' };
  return { clean, whatsapp: `+${digits}` };
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

function fmtPhoneHeaders(hdrList: string[], vals: Record<string, unknown>): string {
  const PHONE_COLS = new Set(['bibNumber', 'rawPhone', 'phoneDigitsOnly', 'whatsappPhone', 'feeRupees']);
  return hdrList.map((h) => (PHONE_COLS.has(h) ? excelText((vals as any)[h]) : escapeCsv((vals as any)[h]))).join(',');
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

  console.log('\nFetching confirmed tickets from DB...');

  const rows: ConfirmedRow[] = await db
    .select({
      id: registrations.id,
      ticketId: registrations.ticketId,
      bibNumber: registrations.bibNumber,
      name: registrations.name,
      email: registrations.email,
      phone: registrations.phone,
      jerseySize: registrations.jerseySize,
      entryType: registrations.entryType,
      feeRupees: registrations.feeRupees,
    })
    .from(registrations)
    .where(
      and(
        sql`${registrations.ticketId} IS NOT NULL`,
        or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free'))
      )
    )
    .orderBy(asc(registrations.bibNumber), asc(registrations.ticketId));

  console.log(`Found ${rows.length} confirmed registrations.\n`);

  const normalized = rows.map((r, i) => {
    const { clean, whatsapp } = normalizePhone(r.phone);
    return {
      seq: i + 1,
      ticketId: r.ticketId ?? '',
      bibNumber: r.bibNumber ?? '',
      name: r.name,
      email: r.email,
      rawPhone: r.phone,
      phoneDigitsOnly: clean,
      whatsappPhone: whatsapp,
      whatsAppReady: whatsapp ? 'YES' : 'NO',
      jerseySize: r.jerseySize ?? '',
      entryType: r.entryType ?? '',
      feeRupees: r.feeRupees ?? '',
    };
  });

  const validWA = normalized.filter((r) => r.whatsAppReady === 'YES');
  const invalidWA = normalized.filter((r) => r.whatsAppReady === 'NO');

  console.log(`  Valid WhatsApp phones (+91 prefix):  ${validWA.length}`);
  console.log(`  Invalid / missing phones:             ${invalidWA.length}`);

  if (invalidWA.length) {
    console.log('\n⚠️  These registrations have invalid/missing phones — double-check them:');
    invalidWA.forEach((r) =>
      console.log(`  ${String(r.seq).padStart(4)}  ${r.ticketId ?? 'N/A'.padEnd(10)}  ${r.name.padEnd(25).slice(0, 25)}  raw="${r.rawPhone}"`)
    );
    console.log();
  }

  const outDir = path.resolve('exports');
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullCsvPath = path.join(outDir, `whatsapp-full-${stamp}.csv`);
  const phoneOnlyCsvPath = path.join(outDir, `whatsapp-phones-only-${stamp}.csv`);
  const phonesTxtPath = path.join(outDir, `whatsapp-phones-only-${stamp}.txt`);
  const invalidPath = path.join(outDir, `whatsapp-invalid-phones-${stamp}.csv`);

  const headers = [
    'seq',
    'ticketId',
    'bibNumber',
    'name',
    'rawPhone',
    'phoneDigitsOnly',
    'whatsappPhone',
    'whatsAppReady',
    'email',
    'jerseySize',
    'entryType',
    'feeRupees',
  ];
  const fullCsvLines = [
    headers.join(','),
    ...normalized.map((r) => fmtPhoneHeaders(headers, r as unknown as Record<string, unknown>)),
  ];
  fs.writeFileSync(fullCsvPath, '\ufeff' + fullCsvLines.join('\n'), 'utf8');
  console.log(`\n✅ Full CSV (all columns):             ${fullCsvPath}`);

  const phoneHeaders = ['ticketId', 'bibNumber', 'name', 'whatsappPhone', 'email'];
  const phoneOnlyLines = [
    phoneHeaders.join(','),
    ...validWA.map((r) => fmtPhoneHeaders(phoneHeaders, r as unknown as Record<string, unknown>)),
  ];
  fs.writeFileSync(phoneOnlyCsvPath, '\ufeff' + phoneOnlyLines.join('\n'), 'utf8');
  console.log(`✅ WhatsApp-only CSV (clean subset):   ${phoneOnlyCsvPath}   (${validWA.length} rows)`);

  const uniquePhones = Array.from(new Set(validWA.map((r) => r.whatsappPhone)));
  fs.writeFileSync(phonesTxtPath, uniquePhones.join('\n'), 'utf8');
  console.log(`✅ Phones TXT (one +91... per line):   ${phonesTxtPath}   (${uniquePhones.length} unique)`);

  if (invalidWA.length) {
    const invHeaders = ['seq', 'ticketId', 'name', 'rawPhone', 'email'];
    const invLines = [
      invHeaders.join(','),
      ...invalidWA.map((r) => fmtPhoneHeaders(invHeaders, r as unknown as Record<string, unknown>)),
    ];
    fs.writeFileSync(invalidPath, '\ufeff' + invLines.join('\n'), 'utf8');
    console.log(`✅ Invalid phones review CSV:          ${invalidPath}   (${invalidWA.length} rows)`);
  }

  console.log('\nNext steps:');
  console.log('  1. Open WhatsApp on your phone → Chats → ➕ New Group');
  console.log('  2. OR: Import the full CSV into Google Contacts → sync → Add Participants in WA batches of 50.');
  console.log('  3. OR: For bulk WhatsApp Web automation: paste the .txt list into any bulk-add tool.');
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

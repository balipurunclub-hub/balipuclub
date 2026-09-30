/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { registrations } from '@/lib/db/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const DEFAULT_COUNTRY_CODE = '91';

function normalizePhone(raw: string): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;
  if (!/^\d{10,15}$/.test(digits)) return '';
  return `+${digits}`;
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

  const rows = await db
    .select({ phone: registrations.phone })
    .from(registrations)
    .where(
      and(
        sql`${registrations.ticketId} IS NOT NULL`,
        or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free'))
      )
    );

  const numbers = Array.from(
    new Set(
      rows
        .map((r) => normalizePhone(r.phone ?? ''))
        .filter(Boolean) as string[]
    )
  ).sort();

  const outDir = path.resolve('exports');
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `whatsapp-numbers-+91-${stamp}.csv`);

  const csv = ['whatsapp_phone', ...numbers.map(excelText)].join('\n') + '\n';
  fs.writeFileSync(outPath, '\ufeff' + csv, 'utf8');

  console.log(`\nTotal confirmed registrations: ${rows.length}`);
  console.log(`Unique valid WhatsApp numbers with +91: ${numbers.length}`);
  console.log(`\nFile written: ${outPath}\n`);
  numbers.slice(0, 10).forEach((n, i) => console.log(`  ${String(i + 1).padStart(3)}. ${n}`));
  if (numbers.length > 10) console.log(`  ... (${numbers.length - 10} more)`);
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

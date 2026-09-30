/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { registrations } from '@/lib/db/schema';
import { eq, and, sql, or, asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

type ConfirmedRow = typeof registrations.$inferSelect;

const EVENT_DATE = '11th October 2026';
const EVENT_TIME = '6:30 AM';
const EVENT_VENUE = 'Mangaluru';
const EVENT_LABEL = 'BALIPU X ALOYSIUS';
const ACCENT = '#FF2D87';
const NAVY = '#1B1B4D';

function sanitizeFilename(s: string): string {
  const fallback = '_';
  const x = (s || fallback).toString().trim();
  if (!x) return fallback;
  return x
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || fallback;
}

function escapeCsv(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function generateTicketPdfBuffer(reg: ConfirmedRow, qrBuffer: Buffer): Promise<Buffer> {
  const ticketCode = reg.ticketId || String(reg.id).slice(0, 8).toUpperCase();
  const isFree = reg.entryType === 'free';

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      doc.rect(0, 0, 595.28, 120).fill(ACCENT);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(28)
        .text('BALIPU RUN CLUB', 0, 40, { align: 'center' });
      doc.fontSize(14).text(`${EVENT_LABEL} — E-TICKET`, 0, 80, { align: 'center' });

      doc.image(qrBuffer, 157.64, 150, { width: 280 });

      doc.fillColor(NAVY).fontSize(22).font('Helvetica-Bold')
        .text(reg.name, 0, 450, { align: 'center' });

      doc.fillColor(ACCENT).fontSize(18).font('Courier-Bold')
        .text(ticketCode, 0, 485, { align: 'center' });

      if (reg.bibNumber != null) {
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16)
          .text(`BIB: ${reg.bibNumber}`, 0, 515, { align: 'center' });
      }

      doc.fillColor(isFree ? '#10b981' : ACCENT).font('Helvetica-Bold').fontSize(12)
        .text(isFree ? 'FREE ENTRY' : 'PAID ENTRY', 0, 540, { align: 'center' });

      doc.rect(147.64, 565, 300, 150).lineWidth(1).stroke('#e2e8f0');

      let y = 580;
      doc.fillColor(NAVY).fontSize(12);
      const row = (label: string, value: string | number | null | undefined) => {
        doc.font('Helvetica-Bold').text(`${label}:`, 170, y);
        doc.font('Helvetica').text(String(value ?? 'N/A'), 280, y);
        y += 24;
      };
      row('Date', EVENT_DATE);
      row('Time', EVENT_TIME);
      row('Venue', EVENT_VENUE);
      if (!isFree) row('Jersey', reg.jerseySize);
      if (reg.couponCode) row('Coupon', reg.couponCode);
      row('Email', reg.email);

      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
        .text('Present this QR code at check-in on event day.', 0, 750, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function buildInfoText(reg: ConfirmedRow): string {
  const lines: string[] = [];
  lines.push('====================================================');
  lines.push('  BALIPU RUN CLUB — EVENT TICKET');
  lines.push('====================================================');
  lines.push('');
  lines.push(`Event:       ${reg.eventName ?? EVENT_LABEL}`);
  lines.push(`Date:        ${EVENT_DATE}`);
  lines.push(`Time:        ${EVENT_TIME}`);
  lines.push(`Venue:       ${EVENT_VENUE}`);
  lines.push('');
  lines.push('----------------------------------------------------');
  lines.push('  PARTICIPANT DETAILS');
  lines.push('----------------------------------------------------');
  lines.push(`Name:        ${reg.name}`);
  lines.push(`Age / Sex:   ${reg.age} yrs, ${reg.gender}`);
  lines.push(`City:        ${reg.city}`);
  lines.push(`Phone:       ${reg.phone}`);
  lines.push(`Email:       ${reg.email}`);
  lines.push(`Source:      ${reg.source}`);
  lines.push('');
  lines.push('----------------------------------------------------');
  lines.push('  TICKET DETAILS');
  lines.push('----------------------------------------------------');
  lines.push(`Ticket ID:   ${reg.ticketId ?? 'N/A'}`);
  lines.push(`BIB Number:  ${reg.bibNumber ?? 'N/A'}`);
  lines.push(`Entry Type:  ${reg.entryType === 'free' ? 'FREE ENTRY' : 'PAID ENTRY'}`);
  lines.push(`Fee:         ${reg.feeRupees != null ? `₹${reg.feeRupees}` : 'N/A'}${reg.originalFeeRupees != null && reg.originalFeeRupees !== reg.feeRupees ? `  (original ₹${reg.originalFeeRupees})` : ''}`);
  lines.push(`Coupon:      ${reg.couponCode ?? 'N/A'}`);
  lines.push(`Jersey Size: ${reg.jerseySize ?? 'N/A'}`);
  lines.push('');
  lines.push('----------------------------------------------------');
  lines.push('  PAYMENT');
  lines.push('----------------------------------------------------');
  lines.push(`Status:      ${reg.paymentStatus ?? 'N/A'}`);
  lines.push(`Order ID:    ${reg.orderId ?? 'N/A'}`);
  lines.push(`Payment ID:  ${reg.paymentId ?? 'N/A'}`);
  lines.push('');
  lines.push('----------------------------------------------------');
  lines.push('  AUDIT');
  lines.push('----------------------------------------------------');
  lines.push(`Registered:  ${reg.createdAt ? new Date(reg.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}`);
  lines.push(`Updated:     ${reg.updatedAt ? new Date(reg.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}`);
  lines.push(`Email sent:  ${reg.emailSent ? 'Yes' : 'No'}`);
  lines.push('');
  lines.push('Please bring the ticket.pdf (print OR phone) + a government-issued ID to the check-in desk on event day.');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  console.log('\nFetching confirmed tickets from DB...');

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

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const exportRoot = path.resolve('exports', `tickets_${stamp}`);
  fs.mkdirSync(exportRoot, { recursive: true });

  console.log(`Export root: ${exportRoot}\n`);

  const csvHeaders = [
    'folder', 'ticketId', 'bibNumber', 'name', 'age', 'gender',
    'city', 'phone', 'email', 'jerseySize', 'entryType', 'feeRupees',
    'originalFeeRupees', 'couponCode', 'paymentStatus', 'orderId', 'paymentId',
    'emailSent', 'eventName', 'createdAt', 'updatedAt',
  ];
  const csvLines: string[] = [csvHeaders.join(',')];

  let ok = 0;
  const failed: Array<{ ticketId: string | null; name: string; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const reg = rows[i];
    const seq = i + 1;
    const ticketId = reg.ticketId ?? `REG-${String(seq).padStart(3, '0')}`;
    const folderName = sanitizeFilename(`${ticketId}__${reg.name}`);
    const folderPath = path.join(exportRoot, folderName);
    fs.mkdirSync(folderPath, { recursive: true });

    process.stdout.write(`[${String(seq).padStart(4, ' ')}/${rows.length}] ${ticketId}  ${reg.name.padEnd(28).slice(0, 28)} → `);

    try {
      const qrBuffer = await QRCode.toBuffer(ticketId, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: NAVY, light: '#FFFFFF' },
      });

      fs.writeFileSync(path.join(folderPath, `QR_${ticketId}.png`), qrBuffer);

      const pdfBuffer = await generateTicketPdfBuffer(reg, qrBuffer);
      fs.writeFileSync(path.join(folderPath, 'ticket.pdf'), pdfBuffer);

      const infoJson = {
        ticket: {
          id: ticketId,
          bib: reg.bibNumber,
          event: { name: reg.eventName ?? EVENT_LABEL, date: EVENT_DATE, time: EVENT_TIME, venue: EVENT_VENUE },
        },
        participant: {
          name: reg.name,
          age: reg.age,
          gender: reg.gender,
          city: reg.city,
          phone: reg.phone,
          email: reg.email,
          emergencyContact: reg.emergencyContact,
          idProof: { type: reg.idProofType ?? null, number: reg.idProofNumber ?? null },
          source: reg.source,
          jerseySize: reg.jerseySize,
        },
        purchase: {
          entryType: reg.entryType,
          feeRupees: reg.feeRupees,
          originalFeeRupees: reg.originalFeeRupees,
          couponCode: reg.couponCode ?? null,
          paymentStatus: reg.paymentStatus,
          orderId: reg.orderId ?? null,
          paymentId: reg.paymentId ?? null,
          pricingPhase: reg.pricingPhase ?? null,
          pricingTierId: reg.pricingTierId ?? null,
        },
        audit: {
          registrationId: reg.id,
          createdAt: reg.createdAt ? new Date(reg.createdAt).toISOString() : null,
          updatedAt: reg.updatedAt ? new Date(reg.updatedAt).toISOString() : null,
          emailSent: Boolean(reg.emailSent),
          attended: Boolean(reg.attended),
          attendedAt: reg.attendedAt ? new Date(reg.attendedAt).toISOString() : null,
        },
        files: {
          pdf: 'ticket.pdf',
          qrPng: `QR_${ticketId}.png`,
          infoTxt: 'info.txt',
          infoJson: 'info.json',
        },
      };
      fs.writeFileSync(path.join(folderPath, 'info.json'), JSON.stringify(infoJson, null, 2), 'utf8');
      fs.writeFileSync(path.join(folderPath, 'info.txt'), buildInfoText(reg), 'utf8');

      csvLines.push([
        folderName,
        ticketId,
        reg.bibNumber ?? '',
        reg.name,
        reg.age,
        reg.gender,
        reg.city,
        reg.phone,
        reg.email,
        reg.jerseySize ?? '',
        reg.entryType ?? '',
        reg.feeRupees ?? '',
        reg.originalFeeRupees ?? '',
        reg.couponCode ?? '',
        reg.paymentStatus ?? '',
        reg.orderId ?? '',
        reg.paymentId ?? '',
        reg.emailSent ? 'true' : 'false',
        reg.eventName ?? '',
        reg.createdAt ? new Date(reg.createdAt).toISOString() : '',
        reg.updatedAt ? new Date(reg.updatedAt).toISOString() : '',
      ].map(escapeCsv).join(','));

      ok++;
      process.stdout.write('✅ OK\n');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      failed.push({ ticketId, name: reg.name, error: msg });
      process.stdout.write(`❌ FAILED — ${msg}\n`);
    }
  }

  fs.writeFileSync(path.join(exportRoot, '_index.csv'), csvLines.join('\n'), 'utf8');

  const readme = [
    '# Balipu Run Club — Confirmed Ticket Export',
    '',
    `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    `Total confirmed tickets: ${rows.length}`,
    `Successfully exported:     ${ok}`,
    `Failed:                    ${failed.length}`,
    '',
    '## Structure',
    '',
    'Each confirmed ticket gets its own subfolder named like:',
    '```',
    '  BRC-007__Mahesh_Bhat_M/',
    '    ticket.pdf        — Printable A4 e-ticket with QR code & participant details',
    '    QR_BRC-007.png    — Standalone QR code image (for scanners / laminates)',
    '    info.json         — Structured JSON with all DB fields (integration)',
    '    info.txt          — Human-readable text summary of the ticket',
    '```',
    '',
    '## Root-level files',
    '',
    '- `_index.csv` — Master spreadsheet of every exported ticket + folder name + phone + email + payment details. Open in Excel / Google Sheets.',
    '',
    '## Tips',
    '',
    '- To ZIP all folders: right-click the `tickets_YYYY-MM-DD...` folder → Send to → Compressed (zipped) folder.',
    '- If you need to re-export a single ticket, use the admin panel link: /admin → Registrations → click the ticket row → Download PDF.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(exportRoot, 'README.txt'), readme, 'utf8');

  console.log(`\n====================================================`);
  console.log(` EXPORT COMPLETE`);
  console.log(`====================================================`);
  console.log(` Total confirmed tickets: ${rows.length}`);
  console.log(` Exported successfully:   ${ok}`);
  console.log(` Failed:                  ${failed.length}`);
  console.log(` Export folder:           ${exportRoot}`);
  console.log(` Index CSV:               ${path.join(exportRoot, '_index.csv')}`);
  console.log(`====================================================`);

  if (failed.length) {
    console.log(`\nFailures:`);
    failed.forEach((f) => console.log(`  - ${f.ticketId}  ${f.name}  — ${f.error}`));
    console.log('');
  }
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

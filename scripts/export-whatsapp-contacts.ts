/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { registrations } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
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
  eventName: string | null;
  createdAt: Date | string | null;
};

function normalizePhone(raw: string, defaultCountry = DEFAULT_COUNTRY_CODE): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('+')) digits = digits.replace(/^\+/, '');
  if (digits.length === 10) digits = defaultCountry + digits;
  if (digits.length === 12 && digits.startsWith(defaultCountry)) {
    // already good
  }
  if (!/^\d{10,15}$/.test(digits)) return '';
  return digits;
}

function whatsAppLink(phoneDigits: string, message?: string): string {
  const base = `https://wa.me/${phoneDigits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

function escapeCsv(val: unknown): string {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

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
      eventName: registrations.eventName,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(
      and(
        sql`${registrations.ticketId} IS NOT NULL`,
        or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free'))
      )
    )
    .orderBy(desc(registrations.createdAt));

  console.log(`\nFound ${rows.length} confirmed registrations.`);

  const eventName = (rows[0]?.eventName || 'Balipu x Aloysius').replace(/[^a-zA-Z0-9_-]/g, '_');
  const outDir = path.resolve('scripts', 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const csvPath = path.join(outDir, `whatsapp-contacts-${eventName}-${stamp}.csv`);
  const txtPath = path.join(outDir, `whatsapp-phones-${eventName}-${stamp}.txt`);
  const linksPath = path.join(outDir, `whatsapp-links-${eventName}-${stamp}.html`);
  const vcfPath = path.join(outDir, `whatsapp-contacts-${eventName}-${stamp}.vcf`);

  const groupInviteMessage = `Hi {name}! 👋 You've confirmed your registration for ${rows[0]?.eventName || 'Balipu x Aloysius'} (Ticket {ticketId}). Tap this link to join the official WhatsApp group — [PASTE_GROUP_INVITE_LINK_HERE]. See you at the start line! 🏃‍♂️🏃‍♀️`;

  const enriched = rows.map((r, i) => {
    const phone = normalizePhone(r.phone ?? '');
    const displayPhone = phone ? `+${phone.slice(0, 2)} ${phone.slice(2)}` : r.phone;
    const regEventName = r.eventName ?? '';
    const waLink = phone
      ? whatsAppLink(phone, groupInviteMessage.replace(/\{name\}/g, r.name).replace(/\{ticketId\}/g, r.ticketId ?? ''))
      : '';
    return {
      seq: i + 1,
      ticketId: r.ticketId ?? '',
      bibNumber: r.bibNumber ?? '',
      name: r.name,
      email: r.email,
      rawPhone: r.phone,
      whatsAppPhone: phone,
      whatsAppPhoneDisplay: displayPhone,
      whatsAppLink: waLink,
      jerseySize: r.jerseySize ?? '',
      entryType: r.entryType ?? '',
      fee: r.feeRupees ?? '',
      eventName: regEventName,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
    };
  });

  const validPhone = enriched.filter((r) => r.whatsAppPhone);
  const invalidPhone = enriched.filter((r) => !r.whatsAppPhone);

  console.log(`  Valid phones (can WhatsApp):  ${validPhone.length}`);
  console.log(`  Invalid/empty phones:          ${invalidPhone.length}`);
  if (invalidPhone.length) {
    console.log('\nInvalid phones:');
    invalidPhone.forEach((r) => console.log(`  ${r.ticketId}  ${r.name.padEnd(25)}  raw="${r.rawPhone}"`));
  }

  // CSV
  const headers = [
    'seq', 'ticketId', 'bibNumber', 'name', 'email',
    'rawPhone', 'whatsAppPhone', 'whatsAppPhoneDisplay',
    'jerseySize', 'entryType', 'feeRupees', 'createdAt', 'whatsAppLink',
  ];
  const csvLines = [
    headers.join(','),
    ...enriched.map((r) => headers.map((h) => escapeCsv((r as any)[h])).join(',')),
  ];
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  console.log(`\n✅ CSV:          ${csvPath}`);

  // TXT — one phone per line (WA-ready, no duplicates)
  const uniquePhones = Array.from(new Set(validPhone.map((r) => r.whatsAppPhone)));
  fs.writeFileSync(txtPath, uniquePhones.join('\n'), 'utf8');
  console.log(`✅ PHONES TXT:   ${txtPath}   (${uniquePhones.length} unique phones)`);

  // VCF (vCard) — import into WhatsApp / Apple Contacts / Google Contacts
  const vcfLines: string[] = [];
  validPhone.forEach((r) => {
    const uid = (r.ticketId || `REG-${r.seq}`).replace(/[^a-zA-Z0-9-]/g, '');
    vcfLines.push(
      'BEGIN:VCARD',
      'VERSION:3.0',
      `UID:${uid}`,
      `FN:${r.name} (${r.ticketId || 'BRC'})`,
      `N:${r.name};;;;`,
      `TEL;TYPE=CELL,WHATSAPP:+${r.whatsAppPhone}`,
      `EMAIL:${r.email}`,
      `NOTE:Balipu Run Club — ${r.eventName || eventName} — Ticket ${r.ticketId || ''} BIB ${r.bibNumber || ''} Jersey ${r.jerseySize || ''}`,
      'ORG:Balipu Run Club',
      'END:VCARD'
    );
  });
  fs.writeFileSync(vcfPath, vcfLines.join('\r\n') + '\r\n', 'utf8');
  console.log(`✅ VCARD:        ${vcfPath}   (import to your phone / Google Contacts)`);

  // HTML clickable link sheet
  const linksHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Balipu Run Club — WhatsApp Invite Links</title>
<style>
  body { font-family: system-ui, -apple-system, Arial; background:#0a0a0a; color:#f1f5f9; padding:24px; }
  h1 { color:#FF2D87; margin:0 0 8px; }
  h2 { margin-top:32px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { padding:8px 10px; border-bottom:1px solid #1f2937; text-align:left; }
  th { color:#FF2D87; position:sticky; top:0; background:#0a0a0a; }
  tr:hover td { background:#111827; }
  a { color:#FF2D87; text-decoration:none; }
  a:hover { text-decoration:underline; }
  .muted { color:#64748b; }
  .pill { display:inline-block; padding:2px 8px; border-radius:999px; background:#1f2937; color:#e2e8f0; font-size:12px; }
  .copy-btn { background:#FF2D87; color:#fff; border:0; border-radius:8px; padding:6px 12px; cursor:pointer; font-weight:600; }
  .copy-btn:hover { background:#e02677; }
  textarea { width:100%; background:#111827; color:#f1f5f9; border:1px solid #1f2937; border-radius:8px; padding:12px; font-family:monospace; font-size:12px; }
</style>
</head>
<body>
  <h1>Balipu Run Club — WhatsApp Invite Links</h1>
  <p class="muted">Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Total: <b>${rows.length}</b> confirmed, <b>${uniquePhones.length}</b> unique WhatsApp-ready phones.</p>

  <h2>Group Invite Link (paste here once you create the group):</h2>
  <p><textarea rows="2" placeholder="Paste your WhatsApp group invite link here (chat.whatsapp.com/...)"></textarea></p>
  <p><button class="copy-btn" onclick="navigator.clipboard.writeText([${JSON.stringify(uniquePhones.join(',+'))}].map(p=>'+'+p).join('\\n'))">📋 Copy all phone numbers</button> &nbsp;
     <button class="copy-btn" onclick="navigator.clipboard.writeText([${JSON.stringify(validPhone.map(r=>r.name).join('\n'))}])">📋 Copy all names</button> &nbsp;
     <button class="copy-btn" onclick="navigator.clipboard.writeText([${JSON.stringify(validPhone.map(r=>`${r.name} <+${r.whatsAppPhone}>`).join('\n'))}])">📋 Copy names + phones</button>
  </p>

  <h2>Individual Links (click to open a WA chat with each person):</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Ticket</th><th>BIB</th><th>Name</th><th>Phone</th><th>Email</th><th>Fee</th><th>WA Link</th></tr>
    </thead>
    <tbody>
${validPhone.map((r) => `      <tr>
        <td>${r.seq}</td>
        <td><span class="pill">${r.ticketId}</span></td>
        <td>${r.bibNumber || ''}</td>
        <td>${r.name}</td>
        <td><a href="${r.whatsAppLink}">+${r.whatsAppPhone}</a></td>
        <td class="muted">${r.email}</td>
        <td>${r.fee ? '₹' + r.fee : ''}</td>
        <td><a class="copy-btn" href="${r.whatsAppLink}" target="_blank" rel="noopener">💬 Chat</a></td>
      </tr>`).join('\n')}
    </tbody>
  </table>

${invalidPhone.length ? `  <h2 style="color:#f59e0b;">⚠️ Registrations without a valid WhatsApp phone</h2>
  <table>
    <thead><tr><th>Ticket</th><th>Name</th><th>Raw phone</th><th>Email</th></tr></thead>
    <tbody>
${invalidPhone.map((r) => `      <tr><td><span class="pill">${r.ticketId}</span></td><td>${r.name}</td><td class="muted">${r.rawPhone || '(empty)'}</td><td>${r.email}</td></tr>`).join('\n')}
    </tbody>
  </table>` : ''}
</body>
</html>`;
  fs.writeFileSync(linksPath, linksHtml, 'utf8');
  console.log(`✅ HTML LINKS:   ${linksPath}   (open in browser, clickable WA chats)`);

  console.log(`\nDone. Files in: ${outDir}\n`);
  console.log('Next: see README / step-by-step guide for Approach 1, 2, or 3.\n');
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { registrations } from '@/lib/db/schema';
import { eq, and, isNull, or, inArray, ilike, sql } from 'drizzle-orm';
import { ALOYSIUS_EVENT_NAME } from '@/lib/registrationPhases';
import type { RegistrationEmailPayload } from '@/lib/sendRegistrationEmail';
import { sendRegistrationConfirmationEmail } from '@/lib/sendRegistrationEmail';

/**
 * Send confirmation emails (with QR ticket) to registrants.
 *
 * Usage:
 *
 *   # Send to everyone in the DB who has a ticket but emailSent=false
 *   npx tsx scripts/send-ticket-emails.ts --all-no-email
 *
 *   # Send to a list of emails from a text file (one email per line)
 *   npx tsx scripts/send-ticket-emails.ts --emails emails.txt
 *
 *   # Provide emails directly on the command line
 *   npx tsx scripts/send-ticket-emails.ts --to a@b.com --to c@d.com
 *
 *   # Even if emailSent=true, re-send (use carefully)
 *   npx tsx scripts/send-ticket-emails.ts --all-no-email --force
 *
 *   # Dry-run mode — just show who would be emailed, don't actually send
 *   npx tsx scripts/send-ticket-emails.ts --all-no-email --dry-run
 */

type Args = {
  allNoEmail?: boolean;
  emailsFile?: string;
  toEmails?: string[];
  force?: boolean;
  dryRun?: boolean;
  help?: boolean;
  delayMs?: number;
};

function parseArgs(argv: string[]): Args {
  const out: Args = { toEmails: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all-no-email') out.allNoEmail = true;
    else if (a === '--emails') out.emailsFile = argv[++i];
    else if (a === '--to') out.toEmails?.push(argv[++i]);
    else if (a === '--force') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--delay') out.delayMs = parseInt(argv[++i], 10);
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
send-ticket-emails.ts — Send registration confirmation emails with QR ticket

USAGE:
  npx tsx scripts/send-ticket-emails.ts [OPTIONS]

OPTIONS:
  --all-no-email        Target every confirmed registration (ticketId exists)
                        where emailSent is false / null.

  --emails FILE         Read emails from FILE, one per line.
                        Lines starting with '#' are skipped.

  --to EMAIL            Add a specific email (repeatable).

  --force               Re-send even if emailSent is already true.

  --dry-run             Only print targets, don't send any emails.

  --delay MS            Delay between emails in ms (default 1000).

  -h, --help            Show this help.

EXAMPLES:
  # Send to everyone who hasn't received the email yet
  npx tsx scripts/send-ticket-emails.ts --all-no-email

  # Send to emails listed in a file
  npx tsx scripts/send-ticket-emails.ts --emails scripts/resend-list.txt

  # Combine: all-no-email PLUS a few extras
  npx tsx scripts/send-ticket-emails.ts --all-no-email --to friend@example.com

  # Just preview
  npx tsx scripts/send-ticket-emails.ts --all-no-email --dry-run
`);
}

type Row = {
  id: string;
  ticketId: string | null;
  bibNumber: number | null;
  name: string;
  email: string;
  jerseySize: string | null;
  entryType: string | null;
  eventName: string | null;
  feeRupees: number | null;
  couponCode: string | null;
  emailSent: boolean | null;
  createdAt: Date | string | null;
};

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.allNoEmail && !args.emailsFile && !args.toEmails?.length) {
    console.error('ERROR: No target specified. Use one of --all-no-email, --emails FILE, --to EMAIL (or combine).\n');
    printHelp();
    process.exit(2);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(2);
  }

  if (!args.dryRun && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    console.error('ERROR: EMAIL_USER / EMAIL_PASS env vars are not set (and --dry-run not given).');
    process.exit(2);
  }

  const delayMs = args.delayMs ?? 1000;
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  const targets: { email: string }[] = [];

  if (args.allNoEmail) {
    const rows = await db
      .select({ email: registrations.email })
      .from(registrations)
      .where(
        and(
          sql`${registrations.ticketId} IS NOT NULL`,
          or(eq(registrations.paymentStatus, 'paid'), eq(registrations.entryType, 'free')),
          args.force ? sql`1=1` : or(eq(registrations.emailSent, false), isNull(registrations.emailSent))
        )
      );
    targets.push(...rows);
  }

  if (args.toEmails?.length) {
    for (const e of args.toEmails) {
      if (e && e.trim()) targets.push({ email: e.trim() });
    }
  }

  if (args.emailsFile) {
    const f = path.resolve(args.emailsFile);
    if (!fs.existsSync(f)) {
      console.error(`ERROR: --emails file not found: ${f}`);
      process.exit(2);
    }
    const text = fs.readFileSync(f, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      // If line is a CSV row containing an email column, try to grab first email-ish token
      const m = t.match(/[^\s,"'<>;=@|]+@[^\s,"'<>;=@|]+\.[^\s,"'<>;=@|]+/i);
      const email = (m ? m[0] : t).replace(/^["']|["']$/g, '');
      if (email) targets.push({ email });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueTargets: string[] = [];
  for (const t of targets) {
    const norm = t.email.trim().toLowerCase();
    if (!norm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    uniqueTargets.push(norm);
  }

  console.log(`\n=== TICKET EMAIL SENDER ===`);
  console.log(`Mode:          ${args.dryRun ? 'DRY-RUN (no emails sent)' : 'LIVE'}`);
  console.log(`Force resend:  ${args.force ? 'yes' : 'no'}`);
  console.log(`Delay per msg: ${delayMs} ms`);
  console.log(`Unique email targets: ${uniqueTargets.length}\n`);

  if (uniqueTargets.length === 0) {
    console.log('No targets. Nothing to do.');
    return;
  }

  // Look up every email's registration rows (matching case-insensitively).
  // Prefer paid+confirmed rows; if multiple, take the newest.
  const allRows: Row[] = await db
    .select({
      id: registrations.id,
      ticketId: registrations.ticketId,
      bibNumber: registrations.bibNumber,
      name: registrations.name,
      email: registrations.email,
      jerseySize: registrations.jerseySize,
      entryType: registrations.entryType,
      eventName: registrations.eventName,
      feeRupees: registrations.feeRupees,
      couponCode: registrations.couponCode,
      emailSent: registrations.emailSent,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(
      or(
        ...uniqueTargets.map((e) =>
          ilike(registrations.email, e)
        )
      )
    );

  // Group rows by normalized email
  const byEmail = new Map<string, Row[]>();
  for (const r of allRows) {
    const k = r.email.trim().toLowerCase();
    if (!byEmail.has(k)) byEmail.set(k, []);
    byEmail.get(k)!.push(r);
  }

  const sendPlan: { email: string; row: Row }[] = [];
  const notFound: string[] = [];
  const noTicket: { email: string; reason: string }[] = [];
  const skippedAlreadySent: { email: string; name: string; ticketId: string }[] = [];

  for (const target of uniqueTargets) {
    const list = byEmail.get(target);
    if (!list || list.length === 0) {
      notFound.push(target);
      continue;
    }
    // Prefer: confirmed (ticketId exists, paid payment) first; then by createdAt desc
    const sorted = [...list].sort((a, b) => {
      const aHasT = a.ticketId ? 1 : 0;
      const bHasT = b.ticketId ? 1 : 0;
      if (aHasT !== bHasT) return bHasT - aHasT;
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    const best = sorted[0];
    if (!best.ticketId) {
      noTicket.push({ email: target, reason: 'No ticketId assigned on any registration row.' });
      continue;
    }
    if (!args.force && best.emailSent) {
      skippedAlreadySent.push({
        email: target,
        name: best.name,
        ticketId: best.ticketId,
      });
      continue;
    }
    sendPlan.push({ email: target, row: best });
  }

  console.log(`PLAN SUMMARY:`);
  console.log(`  Emails to send:        ${sendPlan.length}`);
  console.log(`  Skipped (already sent):${skippedAlreadySent.length}  (use --force to re-send)`);
  console.log(`  No DB match:           ${notFound.length}`);
  console.log(`  No ticket assigned:    ${noTicket.length}`);
  console.log();

  if (sendPlan.length === 0 && !args.dryRun) {
    console.log('Nothing to send.');
    if (notFound.length) {
      console.log('\nEmails NOT FOUND in DB:');
      for (const e of notFound) console.log('  ', e);
    }
    if (noTicket.length) {
      console.log('\nEmails with NO TICKET assigned:');
      for (const n of noTicket) console.log(`  ${n.email} — ${n.reason}`);
    }
    return;
  }

  console.log(`Recipients (${sendPlan.length}):`);
  sendPlan.forEach((p, i) => {
    console.log(
      `  ${String(i + 1).padStart(3, ' ')}. ${p.row.ticketId}  BIB ${String(p.row.bibNumber ?? 'N/A').padStart(3, ' ')}  ${p.row.name.padEnd(30).slice(0, 30)}  <${p.email}>`
    );
  });

  if (args.dryRun) {
    console.log('\nDRY-RUN complete. No emails were sent.');
    if (notFound.length) {
      console.log('\nEmails NOT FOUND in DB:');
      for (const e of notFound) console.log('  ', e);
    }
    if (noTicket.length) {
      console.log('\nEmails with NO TICKET assigned:');
      for (const n of noTicket) console.log(`  ${n.email} — ${n.reason}`);
    }
    return;
  }

  console.log(`\nSending ${sendPlan.length} email(s)...\n`);

  let success = 0;
  const failed: { email: string; name: string; ticketId: string; error: string }[] = [];

  for (let i = 0; i < sendPlan.length; i++) {
    const { email, row } = sendPlan[i];
    const seq = i + 1;
    const prefix = `[${seq}/${sendPlan.length}] ${row.ticketId} <${email}>`;
    process.stdout.write(`${prefix} → `);
    try {
      const payload: RegistrationEmailPayload = {
        registrationId: row.id,
        name: row.name,
        email: row.email,
        ticketId: row.ticketId!,
        bibNumber: row.bibNumber,
        jerseySize: row.jerseySize,
        entryType: row.entryType,
        eventName: row.eventName || ALOYSIUS_EVENT_NAME,
      };
      const ok = await sendRegistrationConfirmationEmail(payload);
      if (!ok) {
        throw new Error('sendRegistrationConfirmationEmail returned false');
      }
      console.log('OK');
      success++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('FAILED —', msg);
      failed.push({
        email,
        name: row.name,
        ticketId: row.ticketId!,
        error: msg,
      });
    }
    if (delayMs > 0 && i < sendPlan.length - 1) await sleep(delayMs);
  }

  console.log(`\n=== FINAL REPORT ===`);
  console.log(`Sent:     ${success}/${sendPlan.length}`);
  console.log(`Failed:   ${failed.length}`);
  console.log(`Skipped (already sent): ${skippedAlreadySent.length}`);
  console.log(`Not found in DB:        ${notFound.length}`);
  console.log(`No ticket in DB:        ${noTicket.length}`);

  if (failed.length) {
    console.log(`\nFAILURES:`);
    for (const f of failed) {
      console.log(`  - ${f.ticketId}  ${f.name}  <${f.email}>  — ${f.error}`);
    }
  }
  if (notFound.length) {
    console.log(`\nEMAILS NOT FOUND IN DB:`);
    for (const e of notFound) console.log(`  - ${e}`);
  }
  if (noTicket.length) {
    console.log(`\nEMAILS WITH NO TICKET:`);
    for (const n of noTicket) console.log(`  - ${n.email} — ${n.reason}`);
  }
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

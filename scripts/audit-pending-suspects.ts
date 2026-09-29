/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { registrations } from '@/lib/db/schema';
import { sql, asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const DEFAULT_COUNTRY_CODE = '91';

type Row = typeof registrations.$inferSelect;

function normalizePhone(raw: string): { digitsOnly: string; whatsappPhone: string } {
  let d = (raw ?? '').replace(/\D/g, '');
  const clean = d;
  if (!d) return { digitsOnly: '', whatsappPhone: '' };
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = DEFAULT_COUNTRY_CODE + d;
  if (!/^\d{10,15}$/.test(d)) return { digitsOnly: clean, whatsappPhone: '' };
  return { digitsOnly: d, whatsappPhone: `+${d}` };
}

function normKeyPhone(raw: string): string {
  let d = (raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = DEFAULT_COUNTRY_CODE + d;
  return d;
}

function normName(raw: string): string {
  return (raw ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normEmail(raw: string): string {
  return (raw ?? '').trim().toLowerCase();
}

function isoDate(v: unknown): string {
  if (v == null) return '';
  try { return new Date(v as string | Date).toISOString(); } catch { return String(v); }
}

function ageMinutes(createdAt: unknown): number {
  if (!createdAt) return -1;
  const ms = Date.now() - new Date(createdAt as string | Date).getTime();
  return Math.round(ms / 60000);
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
  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

  const all: Row[] = await db.select().from(registrations).orderBy(asc(registrations.createdAt));

  const paidRows = all.filter((r) => r.paymentStatus === 'paid');
  const pendingRows = all.filter((r) => r.paymentStatus === 'pending' && (r.entryType ?? 'paid') === 'paid');

  console.log('\n');
  console.log('='.repeat(72));
  console.log('  SUSPECTED "PAID BUT STUCK IN PENDING" AUDIT');
  console.log('='.repeat(72));
  console.log(`\n  Paid rows:        ${paidRows.length}`);
  console.log(`  Pending rows:     ${pendingRows.length}`);
  console.log(`  Total rows:       ${all.length}\n`);

  // ---- Pattern 1: same person has both paid AND pending rows (most likely) ----
  const idxByPhone = new Map<string, Row[]>();
  const idxByEmail = new Map<string, Row[]>();
  const idxByNamePhone = new Map<string, Row[]>();
  for (const r of all) {
    const p = normKeyPhone(r.phone ?? '');
    const e = normEmail(r.email ?? '');
    const np = `${normName(r.name)}|${p}`;
    if (p) (idxByPhone.get(p) || idxByPhone.set(p, []).get(p)!).push(r);
    if (e) (idxByEmail.get(e) || idxByEmail.set(e, []).get(e)!).push(r);
    if (np && np !== '|') (idxByNamePhone.get(np) || idxByNamePhone.set(np, []).get(np)!).push(r);
  }

  type Suspect = {
    reason: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    pendingRow: Row;
    relatedRows: Row[];
  };
  const suspectsMap = new Map<string, Suspect>();
  const addSuspect = (s: Suspect) => {
    const key = s.pendingRow.id;
    const prev = suspectsMap.get(key);
    if (!prev) { suspectsMap.set(key, s); return; }
    const confRank = (c: Suspect['confidence']) => ({ HIGH: 3, MEDIUM: 2, LOW: 1 } as any)[c];
    if (confRank(s.confidence) > confRank(prev.confidence)) {
      prev.confidence = s.confidence;
      prev.reason = `${prev.reason} · ${s.reason}`;
      prev.relatedRows = Array.from(new Set([...prev.relatedRows, ...s.relatedRows]));
    } else {
      prev.reason = `${prev.reason} · ${s.reason}`;
      prev.relatedRows = Array.from(new Set([...prev.relatedRows, ...s.relatedRows]));
    }
  };

  const hasPaid = (arr: Row[]) => arr.some((r) => r.paymentStatus === 'paid');
  const hasPending = (arr: Row[]) => arr.some((r) => r.paymentStatus === 'pending');

  // P1: name+phone matches both paid & pending
  for (const rows of idxByNamePhone.values()) {
    if (hasPaid(rows) && hasPending(rows)) {
      for (const pr of rows.filter((r) => r.paymentStatus === 'pending')) {
        addSuspect({
          reason: 'Same NAME + PHONE also exists as PAID (duplicate registration)',
          confidence: 'HIGH',
          pendingRow: pr,
          relatedRows: rows.filter((r) => r.paymentStatus === 'paid'),
        });
      }
    }
  }
  // P1b: same phone matches (different name maybe typo)
  for (const rows of idxByPhone.values()) {
    if (hasPaid(rows) && hasPending(rows)) {
      for (const pr of rows.filter((r) => r.paymentStatus === 'pending')) {
        addSuspect({
          reason: 'Same PHONE also exists as PAID row',
          confidence: 'HIGH',
          pendingRow: pr,
          relatedRows: rows.filter((r) => r.paymentStatus === 'paid'),
        });
      }
    }
  }
  // P1c: same email matches
  for (const rows of idxByEmail.values()) {
    if (hasPaid(rows) && hasPending(rows)) {
      for (const pr of rows.filter((r) => r.paymentStatus === 'pending')) {
        addSuspect({
          reason: 'Same EMAIL also exists as PAID row',
          confidence: 'MEDIUM',
          pendingRow: pr,
          relatedRows: rows.filter((r) => r.paymentStatus === 'paid'),
        });
      }
    }
  }

  // ---- Pattern 2: pending row orderId / paymentId matches a paid row's orderId/paymentId exactly ----
  const paidOrderIndex = new Map<string, Row>();
  const paidPaymentIndex = new Map<string, Row>();
  for (const r of paidRows) {
    if (r.orderId) paidOrderIndex.set(r.orderId, r);
    if (r.paymentId) paidPaymentIndex.set(r.paymentId, r);
  }
  for (const pr of pendingRows) {
    if (pr.orderId && paidOrderIndex.has(pr.orderId)) {
      addSuspect({
        reason: `orderId ${pr.orderId} already confirmed on ${paidOrderIndex.get(pr.orderId)!.ticketId}`,
        confidence: 'HIGH',
        pendingRow: pr,
        relatedRows: [paidOrderIndex.get(pr.orderId)!],
      });
    }
    if (pr.paymentId && paidPaymentIndex.has(pr.paymentId)) {
      addSuspect({
        reason: `paymentId ${pr.paymentId} already paid on ${paidPaymentIndex.get(pr.paymentId)!.ticketId}`,
        confidence: 'HIGH',
        pendingRow: pr,
        relatedRows: [paidPaymentIndex.get(pr.paymentId)!],
      });
    }
  }

  // ---- Pattern 3: pending row has orderId + couponCode set (means they reached Razorpay) ----
  // A pending cart that never got to payment usually has no orderId and no coupon.
  const BASE_PHASE_1_FEE = 200;
  for (const pr of pendingRows) {
    const hasOrder = !!pr.orderId;
    const hasCoupon = !!pr.couponCode;
    const feeAbovePhase1 = (pr.feeRupees ?? 0) > BASE_PHASE_1_FEE;
    if (hasOrder || hasCoupon || feeAbovePhase1) {
      const reasons: string[] = [];
      if (hasOrder) reasons.push('orderId was generated (reached Razorpay)');
      if (hasCoupon) reasons.push(`coupon applied (${pr.couponCode})`);
      if (feeAbovePhase1) reasons.push(`fee ₹${pr.feeRupees} > phase-1 base ₹${BASE_PHASE_1_FEE} (advanced phase)`);
      addSuspect({
        reason: reasons.join(' · '),
        confidence: hasOrder ? 'MEDIUM' : 'LOW',
        pendingRow: pr,
        relatedRows: [],
      });
    }
  }

  // ---- Rank & print ----
  const suspects = Array.from(suspectsMap.values()).sort((a, b) => {
    const cr = (c: Suspect['confidence']) => ({ HIGH: 3, MEDIUM: 2, LOW: 1 } as any)[c];
    if (cr(b.confidence) !== cr(a.confidence)) return cr(b.confidence) - cr(a.confidence);
    return new Date(a.pendingRow.createdAt ?? 0).getTime() - new Date(b.pendingRow.createdAt ?? 0).getTime();
  });

  console.log(`Found ${suspects.length} suspects across all confidence levels.\n`);

  const byConf = {
    HIGH: suspects.filter((s) => s.confidence === 'HIGH'),
    MEDIUM: suspects.filter((s) => s.confidence === 'MEDIUM'),
    LOW: suspects.filter((s) => s.confidence === 'LOW'),
  };

  console.log('Confidence split:');
  console.log(`  🔴 HIGH   : ${byConf.HIGH.length}`);
  console.log(`  🟡 MEDIUM : ${byConf.MEDIUM.length}`);
  console.log(`  🟢 LOW    : ${byConf.LOW.length}\n`);

  function printGroup(list: Suspect[], title: string, limit = 20) {
    if (!list.length) return;
    console.log(`──────── ${title} (${list.length})`.padEnd(72, '─'));
    list.slice(0, limit).forEach((s, i) => {
      const pr = s.pendingRow;
      const p = normalizePhone(pr.phone ?? '');
      const mins = ageMinutes(pr.createdAt);
      const daysAgo = mins >= 0 ? (mins / 60 / 24).toFixed(1) : '?';
      const relatedTickets = s.relatedRows.map((r) => r.ticketId ?? r.id.slice(0, 8)).join(', ') || '—';
      console.log(`  ${String(i + 1).padStart(3)}. [${pr.ticketId ? pr.ticketId.padEnd(9) : 'NO_TICKET '}]  ${pr.name.padEnd(22).slice(0, 22)}  ${p.whatsappPhone.padEnd(14)}  ₹${String(pr.feeRupees ?? 0).padEnd(4)}  ${daysAgo}d ago  order=${pr.orderId ? 'Y' : 'N'} coup=${pr.couponCode ? pr.couponCode : '—'}`);
      console.log(`       why: ${s.reason}`);
      console.log(`       confirmed-as: ${relatedTickets}`);
    });
    if (list.length > limit) console.log(`  ... (+${list.length - limit} more in CSV)\n`);
    else console.log();
  }
  printGroup(byConf.HIGH, '🔴 HIGH confidence — almost certainly paid (confirm on Razorpay dashboard)');
  printGroup(byConf.MEDIUM, '🟡 MEDIUM confidence — same email paid duplicate OR reached Razorpay order page');
  printGroup(byConf.LOW, '🟢 LOW confidence — coupon applied or higher phase fee but no orderId yet — probably not paid');

  // ---- Summary of totals vs pure "cold cart" pendings ----
  const suspectIds = new Set(suspects.map((s) => s.pendingRow.id));
  const cleanPending = pendingRows.filter((p) => !suspectIds.has(p.id));
  console.log('─'.repeat(72));
  console.log('  PENDING CATEGORIZATION');
  console.log('─'.repeat(72));
  console.log(`  Total pending (entry=paid):                         ${pendingRows.length}   ₹${pendingRows.reduce((s, r) => s + (r.feeRupees ?? 0), 0)}`);
  console.log(`  Suspects (possible paid-but-stuck):                 ${suspects.length}   ₹${suspects.reduce((s, r) => s + (r.pendingRow.feeRupees ?? 0), 0)}`);
  console.log(`     HIGH confidence (confirm first):                 ${byConf.HIGH.length}   ₹${byConf.HIGH.reduce((s, r) => s + (r.pendingRow.feeRupees ?? 0), 0)}`);
  console.log(`     MEDIUM:                                          ${byConf.MEDIUM.length}   ₹${byConf.MEDIUM.reduce((s, r) => s + (r.pendingRow.feeRupees ?? 0), 0)}`);
  console.log(`     LOW:                                             ${byConf.LOW.length}   ₹${byConf.LOW.reduce((s, r) => s + (r.pendingRow.feeRupees ?? 0), 0)}`);
  console.log(`  Pure cold cart (no orderId / no coupon / ₹200):     ${cleanPending.length}   ₹${cleanPending.reduce((s, r) => s + (r.feeRupees ?? 0), 0)}`);
  console.log('─'.repeat(72));
  console.log();
  console.log('HOW TO VERIFY A SUSPECT:');
  console.log('  1. Open Razorpay dashboard → Transactions → Payments');
  console.log('  2. Search by the suspect\'s email OR phone OR (orderId from CSV).');
  console.log('  3. If Razorpay says CAPTURED / PAID → that pending row IS a confirmed payment');
  console.log('     that the webhook missed. You can manually mark it paid + assign next BIB in admin.');
  console.log('  4. If Razorpay has NO record → abandon. The user simply didn\'t pay.\n');

  // ---- Export CSV ----
  const outDir = path.resolve('exports');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `pending-paid-suspects-${stamp}.csv`);
  const headers = [
    'confidence',
    'reasons',
    'pendingTicketId',
    'pendingBib',
    'pendingName',
    'pendingAge',
    'pendingGender',
    'pendingCity',
    'pendingPhone',
    'pendingWhatsappPhone',
    'pendingEmail',
    'pendingJersey',
    'pendingFee',
    'pendingOriginalFee',
    'pendingCoupon',
    'pendingOrderId',
    'pendingPaymentId',
    'pendingCreatedAt',
    'pendingUpdatedAt',
    'pendingDaysAgo',
    'relatedTicketIds',
    'relatedTicketsNames',
  ];
  const TEXT_COLS = new Set(['pendingBib', 'pendingPhone', 'pendingWhatsappPhone', 'pendingFee', 'pendingOriginalFee', 'pendingOrderId', 'pendingPaymentId']);
  const lines = [headers.join(',')];
  for (const s of suspects) {
    const pr = s.pendingRow;
    const p = normalizePhone(pr.phone ?? '');
    const row = {
      confidence: s.confidence,
      reasons: s.reason,
      pendingTicketId: pr.ticketId ?? '',
      pendingBib: pr.bibNumber ?? '',
      pendingName: pr.name,
      pendingAge: pr.age ?? '',
      pendingGender: pr.gender,
      pendingCity: pr.city,
      pendingPhone: pr.phone,
      pendingWhatsappPhone: p.whatsappPhone,
      pendingEmail: pr.email,
      pendingJersey: pr.jerseySize,
      pendingFee: pr.feeRupees ?? '',
      pendingOriginalFee: pr.originalFeeRupees ?? pr.feeRupees ?? '',
      pendingCoupon: pr.couponCode ?? '',
      pendingOrderId: pr.orderId ?? '',
      pendingPaymentId: pr.paymentId ?? '',
      pendingCreatedAt: isoDate(pr.createdAt),
      pendingUpdatedAt: isoDate(pr.updatedAt),
      pendingDaysAgo: (ageMinutes(pr.createdAt) / 60 / 24).toFixed(2),
      relatedTicketIds: s.relatedRows.map((r) => r.ticketId ?? r.id.slice(0, 8)).join(' | '),
      relatedTicketsNames: s.relatedRows.map((r) => r.name).join(' | '),
    };
    lines.push(headers.map((h) => (TEXT_COLS.has(h) ? excelText((row as any)[h]) : escapeCsv((row as any)[h]))).join(','));
  }
  fs.writeFileSync(outPath, '\ufeff' + lines.join('\n'), 'utf8');

  console.log(`✅ Suspects CSV exported: ${outPath}   (${suspects.length} rows)\n`);
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

'use client';

import { Download } from 'lucide-react';
import type { Registration } from '@/types';

const DEFAULT_COUNTRY_CODE = '91';

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

function excelText(val: unknown): string {
  if (val == null || val === '') return '""';
  const s = String(val).replace(/"/g, '""');
  return `"=""${s}"""`;
}

function q(val: unknown): string {
  if (val == null) return '""';
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

function toDateString(v: unknown): string {
  if (v == null) return '';
  try {
    if (typeof v === 'object' && v !== null && 'seconds' in v) {
      return new Date((v as { seconds: number }).seconds * 1000).toLocaleString();
    }
    return new Date(v as string | Date).toLocaleString();
  } catch {
    return String(v);
  }
}

export function ExportCSVButton({ data }: { data: Registration[] }) {
  const handleExport = () => {
    const confirmed = data.filter((reg) => {
      if (!reg.ticketId) return false;
      if ((reg.entryType ?? 'paid') === 'free') return true;
      return reg.paymentStatus === 'paid';
    });

    if (confirmed.length === 0) return;

    const headers = [
      'Ticket ID',
      'BIB Number',
      'Name',
      'Email',
      'Phone',
      'WhatsApp Phone (+91)',
      'Age',
      'Gender',
      'City',
      'Emergency Contact',
      'ID Proof Type',
      'ID Proof Number',
      'Source',
      'Jersey Size',
      'Entry Type',
      'Entry Label',
      'Original Fee (₹)',
      'Fee Paid (₹)',
      'Discount (₹)',
      'Coupon Code',
      'Payment Status',
      'Payment ID',
      'Order ID',
      'Email Sent',
      'Checked In',
      'Date Registered',
    ];

    const rows = confirmed.map((reg) => {
      const p = normalizePhone(reg.phone ?? '');
      const orig = reg.originalFeeRupees ?? reg.feeRupees ?? 0;
      const paid = reg.feeRupees ?? 0;
      return [
        q(reg.ticketId || ''),
        excelText(reg.bibNumber ?? ''),
        q(reg.name || ''),
        q(reg.email || ''),
        excelText(reg.phone || ''),
        excelText(p.whatsappPhone || ''),
        excelText(reg.age ?? ''),
        q(reg.gender || ''),
        q(reg.city || ''),
        excelText(reg.emergencyContact || ''),
        q(reg.idProofType || ''),
        excelText(reg.idProofNumber || ''),
        q(reg.source || ''),
        q(reg.jerseySize || ''),
        q(reg.entryType || 'paid'),
        q((reg.entryType ?? 'paid') === 'free' ? 'FREE ENTRY' : 'PAID ENTRY'),
        excelText(orig || ''),
        excelText(paid || ''),
        excelText(orig - paid || ''),
        q(reg.couponCode ?? ''),
        q(reg.paymentStatus || ''),
        excelText(reg.paymentId || ''),
        excelText(reg.orderId || ''),
        q(reg.emailSent ? 'Yes' : 'No'),
        q(reg.attended ? 'Yes' : 'No'),
        q(toDateString(reg.createdAt)),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const withBom = '\ufeff' + csvContent;

    const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `balipu-run-club-CONFIRMED-tickets-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const totalAll = data.length;
  const totalConfirmed = data.filter((r) =>
    r.ticketId && ((r.entryType ?? 'paid') === 'free' || r.paymentStatus === 'paid')
  ).length;

  return (
    <button
      onClick={handleExport}
      disabled={totalConfirmed === 0}
      title={
        totalConfirmed
          ? `Export ${totalConfirmed} confirmed tickets (${totalAll - totalConfirmed} pending rows excluded)`
          : 'No confirmed tickets yet'
      }
      className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold min-h-11 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4" />
      Export Confirmed CSV
      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#FF2D87]/20 text-[#FF6FAE] border border-[#FF2D87]/30">
        {totalConfirmed}
      </span>
    </button>
  );
}

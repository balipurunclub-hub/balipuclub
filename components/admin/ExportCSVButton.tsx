'use client';

import { Download } from 'lucide-react';
import type { Registration } from '@/types';

export function ExportCSVButton({ data }: { data: Registration[] }) {
  const handleExport = () => {
    if (data.length === 0) return;

    // Headers
    const headers = [
      'Ticket ID',
      'BIB Number',
      'Name',
      'Email',
      'Phone',
      'Age',
      'Gender',
      'City',
      'Emergency Contact',
      'ID Proof Type',
      'ID Proof Number',
      'Source',
      'Jersey Size',
      'Entry Type',
      'Payment Status',
      'Payment ID',
      'Checked In',
      'Date Registered',
    ];

    // Rows
    const rows = data.map((reg) => [
      `"${reg.ticketId || ''}"`,
      `"${reg.bibNumber || ''}"`,
      `"${reg.name || ''}"`,
      `"${reg.email || ''}"`,
      `"${reg.phone || ''}"`,
      `"${reg.age || ''}"`,
      `"${reg.gender || ''}"`,
      `"${reg.city || ''}"`,
      `"${reg.emergencyContact || ''}"`,
      `"${reg.idProofType || ''}"`,
      `"${reg.idProofNumber || ''}"`,
      `"${reg.source || ''}"`,
      `"${reg.jerseySize || ''}"`,
      `"${reg.entryType || 'paid'}"`,
      `"${reg.paymentStatus || ''}"`,
      `"${reg.paymentId || ''}"`,
      `"${reg.attended ? 'Yes' : 'No'}"`,
      `"${reg.createdAt ? new Date(reg.createdAt as string).toLocaleString() : ''}"`,
    ]);

    // CSV String
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Blob & Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `balipu-run-club-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold min-h-11 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}

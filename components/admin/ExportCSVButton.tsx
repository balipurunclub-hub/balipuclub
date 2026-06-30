'use client';

import { Download } from 'lucide-react';
import type { Registration } from '@/types';

export function ExportCSVButton({ data }: { data: Registration[] }) {
  const handleExport = () => {
    if (data.length === 0) return;

    // Headers
    const headers = [
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
      'Payment Status',
      'Payment ID',
      'Date Registered',
    ];

    // Rows
    const rows = data.map((reg) => [
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
      `"${reg.paymentStatus || ''}"`,
      `"${reg.paymentId || ''}"`,
      `"${reg.createdAt?.toDate().toLocaleString() || ''}"`,
    ]);

    // CSV String
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Blob & Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `techfest-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="btn-secondary text-sm py-1.5 px-3 rounded-lg flex items-center gap-1.5"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}

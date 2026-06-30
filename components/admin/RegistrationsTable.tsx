'use client';

import { useState } from 'react';
import { Search, Filter, Mail, Phone } from 'lucide-react';
import type { Registration, PaymentStatus } from '@/types';

interface Props {
  data: Registration[];
}

export function RegistrationsTable({ data }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  const filteredData = data.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            className="form-input py-1.5 px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">BIB No.</th>
                <th className="px-6 py-4 font-semibold">Participant</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Payment Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No registrations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
                  <tr key={reg.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {reg.bibNumber ? `#${reg.bibNumber}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{reg.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">UID: {reg.uid.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{reg.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5" />
                        {reg.phone}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Emg: {reg.emergencyContact || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-y-0.5">
                      <div className="text-slate-700">
                        {reg.age ? `${reg.age} yrs` : 'N/A'}, {reg.gender || 'N/A'}
                      </div>
                      <div className="text-slate-600">{reg.city || 'N/A'}</div>
                      <div className="text-slate-600 text-xs mt-1">
                        Jersey: <span className="text-slate-800 font-medium">{reg.jerseySize || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`badge-${reg.paymentStatus}`}>
                          {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1)}
                        </span>
                        {reg.paymentId && (
                          <span className="text-[10px] text-slate-500 font-mono">{reg.paymentId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {reg.createdAt?.toDate().toLocaleDateString() || 'N/A'}<br/>
                      {reg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-xs text-slate-500 text-right">
        Showing {filteredData.length} of {data.length} total registrations
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  FileDown,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { Registration } from '@/types';

interface Props {
  data: Registration[];
  onManualCheckin?: (reg: Registration) => void;
  onUpdated?: () => void;
}

type ConfirmModalState =
  | { step: 'confirm'; reg: Registration }
  | { step: 'working'; reg: Registration }
  | { step: 'success'; reg: Registration; ticketId?: string; emailSent: boolean }
  | { step: 'error'; reg: Registration; message: string };

export function RegistrationsTable({ data, onManualCheckin, onUpdated }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'paid' | 'pending' | 'all'>('paid');
  const [entryFilter, setEntryFilter] = useState<'all' | 'paid' | 'free'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'not-sent'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'bib-asc' | 'bib-desc'>('newest');
  const [checkinFilter, setCheckinFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const ROWS_PER_PAGE = 20;

  const filteredData = useMemo(() => {
    const result = data.filter((reg) => {
      const matchesSearch =
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.ticketId && reg.ticketId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (reg.eventName && reg.eventName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (reg.phone && reg.phone.includes(searchTerm)) ||
        (reg.bibNumber && reg.bibNumber.toString().includes(searchTerm));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && reg.paymentStatus === 'paid') ||
        (statusFilter === 'pending' && reg.paymentStatus === 'pending');
      const matchesEntry =
        entryFilter === 'all' ||
        (entryFilter === 'free' && reg.entryType === 'free') ||
        (entryFilter === 'paid' && reg.entryType !== 'free');
      const matchesEmail =
        emailFilter === 'all' ||
        (emailFilter === 'sent' && reg.emailSent) ||
        (emailFilter === 'not-sent' && !reg.emailSent);

      const matchesCheckin =
        checkinFilter === 'all' ||
        (checkinFilter === 'checked-in' && reg.attended) ||
        (checkinFilter === 'not-checked-in' && !reg.attended);

      return matchesSearch && matchesStatus && matchesEntry && matchesEmail && matchesCheckin;
    });

    result.sort((a, b) => {
      if (sortOrder === 'bib-asc') {
        const bibA = typeof a.bibNumber === 'number' ? a.bibNumber : 999999;
        const bibB = typeof b.bibNumber === 'number' ? b.bibNumber : 999999;
        return bibA - bibB;
      }
      if (sortOrder === 'bib-desc') {
        const bibA = typeof a.bibNumber === 'number' ? a.bibNumber : -1;
        const bibB = typeof b.bibNumber === 'number' ? b.bibNumber : -1;
        return bibB - bibA;
      }
      
      const getTime = (val: unknown) => {
        if (val && typeof val === 'object' && 'seconds' in val) {
          const seconds = (val as { seconds?: number }).seconds;
          if (typeof seconds === 'number') return seconds * 1000;
        }
        return new Date((val as string | number | Date | null | undefined) || 0).getTime();
      };
      const timeA = getTime(a.createdAt);
      const timeB = getTime(b.createdAt);

      if (sortOrder === 'oldest') {
        return timeA - timeB;
      }
      // default newest
      return timeB - timeA;
    });

    return result;
  }, [data, searchTerm, statusFilter, entryFilter, emailFilter, sortOrder, checkinFilter]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ROWS_PER_PAGE;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData]);

  // Reset to page 1 when search or filter changes
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val as 'paid' | 'pending' | 'all');
    setCurrentPage(1);
  };

  const handleEntryChange = (val: string) => {
    setEntryFilter(val as 'all' | 'paid' | 'free');
    setCurrentPage(1);
  };

  const handleEmailFilterChange = (val: string) => {
    setEmailFilter(val as 'all' | 'sent' | 'not-sent');
    setCurrentPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortOrder(val as 'newest' | 'oldest' | 'bib-asc' | 'bib-desc');
    setCurrentPage(1);
  };

  const handleCheckinFilterChange = (val: 'all' | 'checked-in' | 'not-checked-in') => {
    setCheckinFilter(val);
    setCurrentPage(1);
  };

  const checkedInCount = data.filter(r => r.attended).length;
  const notCheckedInCount = data.length - checkedInCount;
  const paidCount = data.filter((r) => r.paymentStatus === 'paid').length;
  const pendingCount = data.filter((r) => r.paymentStatus === 'pending').length;

  const openConfirmModal = (reg: Registration) => {
    if (reg.paymentStatus !== 'pending') return;
    setConfirmModal({ step: 'confirm', reg });
  };

  const runConfirmPending = async () => {
    if (!confirmModal || confirmModal.step !== 'confirm') return;
    const reg = confirmModal.reg;
    setConfirmModal({ step: 'working', reg });
    try {
      const res = await fetch('/api/admin/confirm-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reg.uid, sendEmail: true }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Confirm failed');
      setConfirmModal({
        step: 'success',
        reg,
        ticketId: payload.registration?.ticketId,
        emailSent: Boolean(payload.emailSent),
      });
      onUpdated?.();
    } catch (err) {
      setConfirmModal({
        step: 'error',
        reg,
        message: err instanceof Error ? err.message : 'Failed to confirm registration',
      });
    }
  };

  const confirmingId =
    confirmModal?.step === 'working' ? confirmModal.reg.uid : null;

  return (
    <div className="space-y-4">
      {/* Check-in filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { val: 'all', label: `All (${data.length})` },
          { val: 'checked-in', label: `✓ Checked In (${checkedInCount})` },
          { val: 'not-checked-in', label: `⏳ Not Yet (${notCheckedInCount})` },
        ] as const).map(tab => (
          <button
            key={tab.val}
            onClick={() => handleCheckinFilterChange(tab.val)}
            className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all border ${
              checkinFilter === tab.val
                ? tab.val === 'checked-in'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : tab.val === 'not-checked-in'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : 'bg-[#FF2D87] text-white border-[#FF2D87] shadow-md'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* Search - full width */}
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, or BIB..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full min-w-0 min-h-11 bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF2D87]/50 focus:ring-1 focus:ring-[#FF2D87]/50 transition-colors text-sm"
          />
        </div>

        {/* Filters - stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:flex-1 sm:min-w-0 min-h-11 bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#FF2D87]/50 focus:ring-1 focus:ring-[#FF2D87]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="paid" className="bg-black text-white">
              Paid ({paidCount})
            </option>
            <option value="pending" className="bg-black text-white">
              Pending ({pendingCount})
            </option>
            <option value="all" className="bg-black text-white">
              All statuses ({data.length})
            </option>
          </select>

          <select
            value={entryFilter}
            onChange={(e) => handleEntryChange(e.target.value)}
            className="w-full sm:flex-1 sm:min-w-0 min-h-11 bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#FF2D87]/50 focus:ring-1 focus:ring-[#FF2D87]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="all" className="bg-black text-white">All Entries</option>
            <option value="paid" className="bg-black text-white">Paid Entry</option>
            <option value="free" className="bg-black text-white">Free Entry</option>
          </select>

          <select
            value={emailFilter}
            onChange={(e) => handleEmailFilterChange(e.target.value)}
            className="w-full sm:flex-1 sm:min-w-0 min-h-11 bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#FF2D87]/50 focus:ring-1 focus:ring-[#FF2D87]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="all" className="bg-black text-white">All Emails</option>
            <option value="sent" className="bg-black text-white">Email Sent</option>
            <option value="not-sent" className="bg-black text-white">Email Pending</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full sm:flex-1 sm:min-w-0 min-h-11 bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#FF2D87]/50 focus:ring-1 focus:ring-[#FF2D87]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="newest" className="bg-black text-white">Newest First</option>
            <option value="oldest" className="bg-black text-white">Oldest First</option>
            <option value="bib-asc" className="bg-black text-white">BIB ↑</option>
            <option value="bib-desc" className="bg-black text-white">BIB ↓</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {currentTableData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No registrations found matching your criteria.
          </div>
        ) : (
          currentTableData.map((reg) => (
            <div key={reg.uid} className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-4 space-y-3 min-w-0">
              {/* Top row: name + status badges */}
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="font-semibold text-white break-words">{reg.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">{reg.ticketId || '-'}</p>
                  {reg.eventName && (
                    <p className="text-[10px] text-[#FF2D87]/80 font-semibold uppercase tracking-wider mt-1">
                      {reg.eventName}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {reg.entryType && (
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${reg.entryType === 'free' ? 'bg-white/10 text-white/50' : 'bg-[#FF2D87]/10 text-[#FF2D87]'}`}>
                      {reg.entryType} Entry
                    </span>
                  )}
                  <span className={`badge-${reg.paymentStatus}`}>
                    {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Info pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {reg.bibNumber && (
                  <span className="bg-[#FF2D87]/10 text-[#FF2D87] font-bold px-2 py-0.5 rounded">BIB: {reg.bibNumber}</span>
                )}
                {reg.jerseySize && (
                  <span className="bg-white/5 text-slate-300 px-2 py-0.5 rounded">Jersey: {reg.jerseySize}</span>
                )}
                {reg.age && (
                  <span className="bg-white/5 text-slate-300 px-2 py-0.5 rounded">{reg.age}y • {reg.gender}</span>
                )}
                {reg.attended && (
                  <span className="bg-green-500/10 text-green-400 font-bold px-2 py-0.5 rounded">✓ Checked In</span>
                )}
              </div>

              {/* Contact row */}
              <div className="flex flex-col gap-1 text-xs text-slate-400 min-w-0">
                <span className="flex items-start gap-1 min-w-0"><Mail className="w-3 h-3 shrink-0 mt-0.5" /><span className="break-all">{reg.email}</span></span>
                {reg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{reg.phone}</span>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                {reg.paymentStatus === 'pending' && (
                  <button
                    type="button"
                    disabled={confirmingId === reg.uid}
                    onClick={() => openConfirmModal(reg)}
                    className="inline-flex items-center gap-1.5 bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-medium text-xs min-h-11 px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {confirmingId === reg.uid ? 'Confirming…' : 'Confirm + Send mail'}
                  </button>
                )}
                {reg.phone && reg.phone !== 'Yet to be submitted' && (
                  <>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const waText = `Hi ${reg.name},\n\nYour registration for The Monsoon Run (Balipu Run Club) is confirmed!\n\nTicket ID: ${reg.ticketId || reg.uid.slice(0, 8).toUpperCase()}\n${reg.bibNumber ? `BIB Number: ${reg.bibNumber}\n` : ''}\nEvent Details:\n📅 Date: 12th July 2026\n⏰ Time: 6:30 AM\n📍 Venue: Decathlon, Bharath Mall\n👕 Jersey: ${reg.jerseySize || 'N/A'}\n\nPlease bring your E-Ticket (QR code) on the day of the event. We look forward to seeing you at the starting line!`;
                        window.open(`https://wa.me/${reg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`, '_blank');
                      }}
                      className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors text-xs font-medium min-h-11"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href={`/api/admin/ticket-pdf/${reg.uid}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-[#FF2D87] hover:text-[#ff4d9a] transition-colors text-xs font-medium min-h-11"
                    >
                      <FileDown className="w-4 h-4" /> Ticket PDF
                    </a>
                  </>
                )}
                {onManualCheckin && (
                  <div className="ml-auto">
                    {!reg.attended ? (
                      <button
                        onClick={() => onManualCheckin(reg)}
                        className="bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-medium text-xs min-h-11 px-4 py-2 rounded-full transition-colors active:scale-95"
                      >
                        Check In
                      </button>
                    ) : (
                      <span className="text-green-400/60 text-xs font-bold uppercase tracking-wider">✓ Done</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-slate-400 uppercase text-xs tracking-wider border-b border-white/10">
              <tr className="divide-x divide-white/10">
                <th className="px-6 py-4 font-semibold">Ticket ID</th>
                <th className="px-6 py-4 font-semibold">Participant</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Payment Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTableData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No registrations found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentTableData.map((reg) => (
                  <tr key={reg.uid} className="hover:bg-white/5 transition-colors divide-x divide-white/5">
                    <td className="px-6 py-4 font-medium text-white font-mono">
                      <div>{reg.ticketId || '-'}</div>
                      {reg.bibNumber && (
                        <div className="text-xs text-[#FF2D87] font-bold mt-1 bg-[#FF2D87]/10 inline-block px-2 py-0.5 rounded">
                          BIB: {reg.bibNumber}
                        </div>
                      )}
                      {reg.attended && (
                        <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1">
                          ✓ Checked In
                        </div>
                      )}
                      {reg.emailSent ? (
                        <div className="text-[10px] text-[#FF2D87] font-bold uppercase tracking-wider mt-1">
                          📧 Email Sent
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                          ✉️ Pending Email
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{reg.name}</div>
                      {reg.eventName && (
                        <div className="text-[10px] text-[#FF2D87]/80 font-semibold uppercase tracking-wider mt-0.5">
                          {reg.eventName}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 font-mono mt-0.5">UID: {(reg.uid || '').slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px] break-all">{reg.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {reg.phone}
                        {reg.phone && reg.phone !== 'Yet to be submitted' && (
                          <div className="flex items-center gap-2 ml-2">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                const waText = `Hi ${reg.name},\n\nYour registration for The Monsoon Run (Balipu Run Club) is confirmed!\n\nTicket ID: ${reg.ticketId || reg.uid.slice(0, 8).toUpperCase()}\n${reg.bibNumber ? `BIB Number: ${reg.bibNumber}\n` : ''}\nEvent Details:\n📅 Date: 12th July 2026\n⏰ Time: 6:30 AM\n📍 Venue: Decathlon, Bharath Mall\n👕 Jersey: ${reg.jerseySize || 'N/A'}\n\nPlease bring your E-Ticket (QR code) on the day of the event. We look forward to seeing you at the starting line!`;
                                window.open(`https://wa.me/${reg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`, '_blank');
                              }}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Send WhatsApp Message"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            <a
                              href={`/api/admin/ticket-pdf/${reg.uid}`}
                              target="_blank"
                              className="text-[#FF2D87] hover:text-[#ff4d9a] transition-colors"
                              title="Download PDF Ticket"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Emg: {reg.emergencyContact || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-y-0.5">
                      <div className="text-slate-300">
                        {reg.age ? `${reg.age} yrs` : 'N/A'}, {reg.gender || 'N/A'}
                      </div>
                      <div className="text-slate-400">{reg.city || 'N/A'}</div>
                      <div className="text-slate-400 text-xs mt-1">
                        Jersey: <span className="text-white font-medium">{reg.jerseySize || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`badge-${reg.paymentStatus}`}>
                          {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1)}
                        </span>
                        {reg.entryType && (
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${reg.entryType === 'free' ? 'bg-white/10 text-white/50' : 'bg-[#FF2D87]/10 text-[#FF2D87]'}`}>
                            {reg.entryType} Entry
                          </span>
                        )}
                        {reg.paymentId && (
                          <span className="text-[10px] text-slate-400 font-mono">{reg.paymentId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {reg.createdAt
                        ? new Date(reg.createdAt as string).toLocaleDateString()
                        : 'N/A'}
                      <br />
                      {reg.createdAt
                        ? new Date(reg.createdAt as string).toLocaleTimeString('en-IN', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        {reg.paymentStatus === 'pending' && (
                          <button
                            type="button"
                            disabled={confirmingId === reg.uid}
                            onClick={() => openConfirmModal(reg)}
                            className="bg-amber-500/90 hover:bg-amber-500 text-black font-semibold text-xs px-3 py-2 rounded-full transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {confirmingId === reg.uid ? '…' : 'Confirm + Mail'}
                          </button>
                        )}
                        {onManualCheckin && (
                          !reg.attended ? (
                            <button 
                              onClick={() => onManualCheckin(reg)}
                              className="bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-medium text-xs px-4 py-2 rounded-full transition-colors active:scale-95 flex items-center justify-center min-w-[90px]"
                            >
                              Check In
                            </button>
                          ) : (
                            <span className="text-green-400/50 font-medium text-[10px] uppercase tracking-wider px-3 py-1.5 border border-green-500/20 rounded-full bg-green-500/5">
                              Done
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          Showing {filteredData.length > 0 ? (currentPage - 1) * ROWS_PER_PAGE + 1 : 0} to{' '}
          {Math.min(currentPage * ROWS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
          {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center min-h-11 min-w-11 p-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center min-h-11 min-w-11 p-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#FF2D87]/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up mx-2">
            <div className="relative p-5 sm:p-6 text-center border-b border-white/10">
              <div
                className={`w-14 h-14 border rounded-full flex items-center justify-center mx-auto mb-4 ${
                  confirmModal.step === 'error'
                    ? 'bg-red-500/15 border-red-500/30'
                    : confirmModal.step === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : 'bg-[#FF2D87]/15 border-[#FF2D87]/30'
                }`}
              >
                {confirmModal.step === 'working' ? (
                  <RefreshCw className="w-7 h-7 text-[#FF2D87] animate-spin" />
                ) : confirmModal.step === 'success' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : confirmModal.step === 'error' ? (
                  <AlertCircle className="w-7 h-7 text-red-400" />
                ) : (
                  <Mail className="w-7 h-7 text-[#FF2D87]" />
                )}
              </div>
              <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-1">
                {confirmModal.step === 'confirm' && 'Confirm + Send mail'}
                {confirmModal.step === 'working' && 'Confirming…'}
                {confirmModal.step === 'success' && 'Confirmed'}
                {confirmModal.step === 'error' && 'Could not confirm'}
              </h2>
              <p className="text-white/55 text-sm mt-1 break-words px-2">
                {confirmModal.reg.name}
              </p>
              {confirmModal.step !== 'working' && (
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="absolute top-4 right-4 p-2 text-white/40 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {confirmModal.step === 'confirm' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Email', value: confirmModal.reg.email },
                      { label: 'Phone', value: confirmModal.reg.phone || 'N/A' },
                      { label: 'Fee', value: confirmModal.reg.feeRupees != null ? `₹${confirmModal.reg.feeRupees}` : 'N/A' },
                      { label: 'Order', value: confirmModal.reg.orderId || '—' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-black/50 p-3 rounded-xl border border-white/10 min-w-0"
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">
                          {item.label}
                        </p>
                        <p className="font-semibold text-white text-sm break-all">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed text-center">
                    This marks the registration as paid, assigns a ticket and BIB, then sends the
                    confirmation email with QR.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmModal(null)}
                      className="flex-1 min-h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/5 font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={runConfirmPending}
                      className="flex-1 min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm + Mail
                    </button>
                  </div>
                </>
              )}

              {confirmModal.step === 'working' && (
                <p className="text-center text-white/55 text-sm py-4">
                  Assigning ticket and sending email…
                </p>
              )}

              {confirmModal.step === 'success' && (
                <>
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 text-center space-y-1">
                    {confirmModal.ticketId && (
                      <p>
                        Ticket:{' '}
                        <span className="font-mono font-bold text-white">{confirmModal.ticketId}</span>
                      </p>
                    )}
                    <p>
                      {confirmModal.emailSent
                        ? 'Confirmation email sent.'
                        : 'Ticket assigned, but email could not be sent. Check EMAIL settings.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="w-full min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold transition-colors"
                  >
                    Done
                  </button>
                </>
              )}

              {confirmModal.step === 'error' && (
                <>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center break-words">
                    {confirmModal.message}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmModal(null)}
                      className="flex-1 min-h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/5 font-semibold transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ step: 'confirm', reg: confirmModal.reg })}
                      className="flex-1 min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

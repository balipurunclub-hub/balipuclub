'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Mail, Phone, ChevronLeft, ChevronRight, MessageCircle, FileDown } from 'lucide-react';
import type { Registration, PaymentStatus } from '@/types';

interface Props {
  data: Registration[];
  onManualCheckin?: (reg: Registration) => void;
}

export function RegistrationsTable({ data, onManualCheckin }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entryFilter, setEntryFilter] = useState<'all' | 'paid' | 'free'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'not-sent'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'bib-asc' | 'bib-desc'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 20;

  const filteredData = useMemo(() => {
    let result = data.filter((reg) => {
      const matchesSearch =
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.bibNumber && reg.bibNumber.toString().includes(searchTerm));
      const matchesEntry = 
        entryFilter === 'all' || 
        (entryFilter === 'free' && reg.entryType === 'free') ||
        (entryFilter === 'paid' && reg.entryType !== 'free');
      const matchesEmail = 
        emailFilter === 'all' || 
        (emailFilter === 'sent' && reg.emailSent) || 
        (emailFilter === 'not-sent' && !reg.emailSent);
        
      return matchesSearch && matchesEntry && matchesEmail;
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
      
      const getTime = (val: any) => val?.seconds ? val.seconds * 1000 : new Date(val || 0).getTime();
      const timeA = getTime(a.createdAt);
      const timeB = getTime(b.createdAt);

      if (sortOrder === 'oldest') {
        return timeA - timeB;
      }
      // default newest
      return timeB - timeA;
    });

    return result;
  }, [data, searchTerm, entryFilter, emailFilter, sortOrder]);

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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* Search - full width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, or BIB..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:border-[#F5841F]/50 focus:ring-1 focus:ring-[#F5841F]/50 transition-colors text-sm"
          />
        </div>

        {/* Filters - wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={entryFilter}
            onChange={(e) => handleEntryChange(e.target.value)}
            className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#F5841F]/50 focus:ring-1 focus:ring-[#F5841F]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="all" className="bg-[#1B1B4D] text-white">All Entries</option>
            <option value="paid" className="bg-[#1B1B4D] text-white">Paid Entry</option>
            <option value="free" className="bg-[#1B1B4D] text-white">Free Entry</option>
          </select>

          <select
            value={emailFilter}
            onChange={(e) => handleEmailFilterChange(e.target.value)}
            className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#F5841F]/50 focus:ring-1 focus:ring-[#F5841F]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="all" className="bg-[#1B1B4D] text-white">All Emails</option>
            <option value="sent" className="bg-[#1B1B4D] text-white">Email Sent</option>
            <option value="not-sent" className="bg-[#1B1B4D] text-white">Email Pending</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-[#F5841F]/50 focus:ring-1 focus:ring-[#F5841F]/50 transition-colors text-sm appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="newest" className="bg-[#1B1B4D] text-white">Newest First</option>
            <option value="oldest" className="bg-[#1B1B4D] text-white">Oldest First</option>
            <option value="bib-asc" className="bg-[#1B1B4D] text-white">BIB ↑</option>
            <option value="bib-desc" className="bg-[#1B1B4D] text-white">BIB ↓</option>
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
            <div key={reg.uid} className="bg-[#1B1B4D]/80 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
              {/* Top row: name + status badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{reg.name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{reg.ticketId || '-'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {reg.entryType && (
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${reg.entryType === 'free' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#F5841F]/10 text-[#F5841F]'}`}>
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
                  <span className="bg-[#F5841F]/10 text-[#F5841F] font-bold px-2 py-0.5 rounded">BIB: {reg.bibNumber}</span>
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{reg.email}</span>
                {reg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reg.phone}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                {reg.phone && reg.phone !== 'Yet to be submitted' && (
                  <>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const waText = `Hi ${reg.name},\n\nYour registration for The Monsoon Run (Balipu Run Club) is confirmed!\n\nTicket ID: ${reg.ticketId || reg.uid.slice(0, 8).toUpperCase()}\n${reg.bibNumber ? `BIB Number: ${reg.bibNumber}\n` : ''}\nEvent Details:\n📅 Date: 12th July 2026\n⏰ Time: 6:30 AM\n📍 Venue: Decathlon, Bharath Mall\n👕 Jersey: ${reg.jerseySize || 'N/A'}\n\nPlease bring your E-Ticket (QR code) on the day of the event. We look forward to seeing you at the starting line!`;
                        window.open(`https://wa.me/${reg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`, '_blank');
                      }}
                      className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors text-xs font-medium"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href={`/api/admin/ticket-pdf/${reg.uid}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium"
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
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow transition-all active:scale-95"
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
      <div className="hidden md:block bg-[#1B1B4D]/80 border border-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
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
                {onManualCheckin && <th className="px-6 py-4 font-semibold">Actions</th>}
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
                        <div className="text-xs text-[#F5841F] font-bold mt-1 bg-[#F5841F]/10 inline-block px-2 py-0.5 rounded">
                          BIB: {reg.bibNumber}
                        </div>
                      )}
                      {reg.attended && (
                        <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1">
                          ✓ Checked In
                        </div>
                      )}
                      {reg.emailSent ? (
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-1">
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
                      <div className="text-xs text-slate-400 font-mono mt-0.5">UID: {(reg.uid || '').slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[150px]">{reg.email}</span>
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
                                const baseUrl = window.location.origin;
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
                              className="text-blue-400 hover:text-blue-300 transition-colors"
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
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${reg.entryType === 'free' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#F5841F]/10 text-[#F5841F]'}`}>
                            {reg.entryType} Entry
                          </span>
                        )}
                        {reg.paymentId && (
                          <span className="text-[10px] text-slate-400 font-mono">{reg.paymentId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {reg.createdAt?.toDate().toLocaleDateString() || 'N/A'}<br/>
                        {new Date(reg.createdAt?.toDate()).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </td>
                    {onManualCheckin && (
                      <td className="px-6 py-4">
                        {!reg.attended ? (
                          <button 
                            onClick={() => onManualCheckin(reg)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow hover:shadow-md transition-all active:scale-95 flex items-center justify-center min-w-[90px]"
                          >
                            Check In
                          </button>
                        ) : (
                          <span className="text-green-400/50 font-medium text-[10px] uppercase tracking-wider px-3 py-1.5 border border-green-500/20 rounded-full bg-green-500/5">
                            Done
                          </span>
                        )}
                      </td>
                    )}
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
              className="p-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

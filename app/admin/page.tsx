'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode, type ComponentType } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminShell } from '@/components/admin/AdminShell';
import { RegistrationsTable } from '@/components/admin/RegistrationsTable';
import { ExportCSVButton } from '@/components/admin/ExportCSVButton';
import {
  Users,
  IndianRupee,
  RefreshCw,
  QrCode,
  Mail,
  CheckSquare,
  X,
  CheckCircle2,
  UserCheck,
  Gift,
} from 'lucide-react';
import type { Registration } from '@/types';
import Link from 'next/link';

const POLL_INTERVAL_MS = 6000;

function StatCard({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  suffix?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#FF2D87]/25 bg-[#0a0a0a] p-4 sm:p-5 min-w-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#FF2D87]/35 bg-[#FF2D87]/10 flex items-center justify-center text-[#FF2D87] shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-white/45 text-[0.65rem] sm:text-xs font-semibold tracking-[0.18em] uppercase break-words">
            {label}
          </p>
          <h3 className="font-heading text-[#FF2D87] text-2xl sm:text-3xl tracking-wide mt-0.5">
            {value}
            {suffix}
          </h3>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardInner() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkinTarget, setCheckinTarget] = useState<Registration | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const isInitialLoad = useRef(true);

  const fetchRegistrations = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/registrations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch registrations');
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch registrations. Check database connection.');
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
    const interval = setInterval(() => fetchRegistrations({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchRegistrations]);

  const totalCount = registrations.length;
  const freeCount = registrations.filter((r) => r.entryType === 'free').length;
  const paidEntryCount = registrations.filter((r) => r.entryType !== 'free').length;
  const checkedInCount = registrations.filter((r) => r.attended).length;

  const confirmCheckIn = async () => {
    if (!checkinTarget) return;
    setIsCheckingIn(true);
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkinTarget.uid, attended: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in');
      setRegistrations((prev) =>
        prev.map((r) => (r.uid === checkinTarget.uid ? { ...r, attended: true } : r))
      );
      setCheckinTarget(null);
    } catch (err) {
      console.error(err);
      alert('Failed to check in manually.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total" value={totalCount} icon={Users} />
        <StatCard label="Paid" value={paidEntryCount} icon={IndianRupee} />
        <StatCard label="Free" value={freeCount} icon={Gift} />
        <StatCard
          label="Checked In"
          value={checkedInCount}
          icon={UserCheck}
          suffix={<span className="text-white/40 text-base font-sans font-normal"> / {totalCount}</span>}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/send-emails"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
        >
          <Mail className="w-4 h-4" />
          Send Emails
        </Link>
        <Link
          href="/scan"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#FF2D87] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          Open Scanner
        </Link>
        <Link
          href="/admin/scanner-controls"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-[#FF2D87]/40 hover:text-white transition-colors"
        >
          Scanner Controls
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between min-w-0">
        <div className="min-w-0">
          <h2 className="font-heading text-white uppercase tracking-wide text-lg sm:text-xl">
            Registrations
          </h2>
          <p className="text-[#FF2D87] text-xs font-medium mt-1 tracking-wide">Live · updates automatically</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchRegistrations()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold min-h-11 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <ExportCSVButton data={registrations} />
        </div>
      </div>

      {loading && isInitialLoad.current ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-[#FF2D87]" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-sm">
          {error}
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-2xl border border-[#FF2D87]/25 bg-[#0a0a0a] px-6 py-16 text-center">
          <p className="font-heading text-white uppercase tracking-wide text-lg mb-2">No registrations yet</p>
          <p className="text-white/50 text-sm">
            New Balipu x Aloysius sign-ups will appear here automatically.
          </p>
        </div>
      ) : (
        <RegistrationsTable data={registrations} onManualCheckin={setCheckinTarget} />
      )}

      {checkinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#FF2D87]/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up mx-2">
            <div className="relative p-5 sm:p-6 text-center border-b border-white/10">
              <div className="w-14 h-14 bg-[#FF2D87]/15 border border-[#FF2D87]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-7 h-7 text-[#FF2D87]" />
              </div>
              <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-1">
                Manual Check-In
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
                <p className="text-[#FF2D87] font-mono text-sm break-all px-4">{checkinTarget.ticketId}</p>
                {checkinTarget.entryType && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      checkinTarget.entryType === 'free'
                        ? 'bg-white/10 text-white/60'
                        : 'bg-[#FF2D87]/15 text-[#FF2D87]'
                    }`}
                  >
                    {checkinTarget.entryType === 'free' ? 'Free entry' : 'Paid entry'}
                  </span>
                )}
              </div>
              <button
                onClick={() => !isCheckingIn && setCheckinTarget(null)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:bg-white/10 rounded-full transition-colors"
                disabled={isCheckingIn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Name', value: checkinTarget.name },
                  ...(checkinTarget.entryType !== 'free'
                    ? [{ label: 'Jersey', value: checkinTarget.jerseySize || 'N/A' }]
                    : []),
                  { label: 'Age / Gender', value: `${checkinTarget.age} • ${checkinTarget.gender}` },
                  { label: 'BIB', value: checkinTarget.bibNumber || 'N/A' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-black/50 p-3 rounded-xl border border-white/10 min-w-0"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">
                      {item.label}
                    </p>
                    <p className="font-semibold text-white break-words">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCheckinTarget(null)}
                  className="flex-1 min-h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/5 font-semibold transition-colors"
                  disabled={isCheckingIn}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCheckIn}
                  className="flex-1 min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminShell
        title="Admin"
        description="Manage Balipu x Aloysius registrations, check-ins, and email."
      >
        <AdminDashboardInner />
      </AdminShell>
    </AdminRoute>
  );
}

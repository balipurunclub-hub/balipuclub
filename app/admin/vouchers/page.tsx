'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminShell } from '@/components/admin/AdminShell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TicketPercent,
  Mail,
  ScanLine,
  SlidersHorizontal,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Clock,
  Tag,
  Percent,
  Hash,
  X,
  Lock,
} from 'lucide-react';

type CouponListItem = {
  id: string;
  code: string;
  percentOff: number;
  maxUses: number;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  isStatic?: boolean;
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Vouchers', href: '/admin/vouchers', icon: TicketPercent },
  { label: 'Send Emails', href: '/admin/send-emails', icon: Mail },
  { label: 'Scanner Controls', href: '/admin/scanner-controls', icon: SlidersHorizontal },
  { label: 'Scanners', href: '/admin/scanners', icon: ScanLine },
  { label: 'Bulk Upload', href: '/admin/bulk-upload', icon: Upload },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function isCouponActive(coupon: CouponListItem, now = new Date()): boolean {
  if (coupon.validFrom) {
    const from = new Date(coupon.validFrom);
    if (now < from) return false;
  }
  if (coupon.validUntil) {
    const until = new Date(coupon.validUntil);
    if (now > until) return false;
  }
  return coupon.usedCount < coupon.maxUses;
}

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-3 sm:p-4 space-y-1 shrink-0 w-full lg:w-60">
      <div className="px-3 py-2 mb-3 border-b border-white/10">
        <p className="text-[#FF2D87] text-[0.6rem] font-semibold tracking-[0.2em] uppercase mb-1">
          Balipu Club
        </p>
        <p className="text-white/80 text-sm font-bold uppercase tracking-wide">Admin Menu</p>
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== '/admin' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors min-w-0 ${
              isActive
                ? 'bg-[#FF2D87]/15 text-[#FF2D87] border border-[#FF2D87]/30'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}

export default function VouchersPage() {
  const [coupons, setCoupons] = useState<CouponListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [percentOff, setPercentOff] = useState(20);
  const [maxUses, setMaxUses] = useState(10);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [formError, setFormError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load vouchers');
      setCoupons(data.coupons || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const resetForm = () => {
    setCode('');
    setPercentOff(20);
    setMaxUses(10);
    setValidFrom('');
    setValidUntil('');
    setFormError('');
    setFormOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const trimmedCode = code.trim().toUpperCase();
      if (!trimmedCode) {
        setFormError('Coupon code is required.');
        return;
      }
      if (!/^[A-Z0-9_-]+$/.test(trimmedCode)) {
        setFormError('Coupon code may only contain letters, numbers, underscores, and dashes.');
        return;
      }
      if (percentOff < 0 || percentOff > 100) {
        setFormError('Discount must be between 0 and 100.');
        return;
      }
      if (maxUses < 1) {
        setFormError('Max uses must be at least 1.');
        return;
      }
      if (validFrom && validUntil && new Date(validFrom) > new Date(validUntil)) {
        setFormError('Valid from date cannot be after valid until date.');
        return;
      }

      const body: Record<string, unknown> = {
        code: trimmedCode,
        percentOff,
        maxUses,
      };
      if (validFrom) body.validFrom = new Date(validFrom).toISOString();
      if (validUntil) body.validUntil = new Date(validUntil).toISOString();

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create voucher');
        return;
      }

      setSuccessMsg(`Voucher "${trimmedCode}" created successfully!`);
      setCoupons((prev) => [data.coupon, ...prev]);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon: CouponListItem) => {
    if (!confirm(`Are you sure you want to delete voucher "${coupon.code}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(coupon.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete voucher');
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      setSuccessMsg(`Voucher "${coupon.code}" deleted.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete voucher');
    } finally {
      setDeletingId(null);
    }
  };

  const now = new Date();

  return (
    <AdminRoute>
      <AdminShell
        title="Vouchers & Coupons"
        description="Create custom discount vouchers with validity periods and ticket usage limits."
        backHref="/admin"
        maxWidth="full"
      >
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-w-0">
          <AdminSidebar />

          <div className="flex-1 space-y-6 min-w-0">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 flex items-center gap-2 min-w-0">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 text-emerald-400 flex items-center gap-2 min-w-0 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="break-words">{successMsg}</span>
              </div>
            )}

            {!loading && coupons.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-4 sm:p-5 min-w-0">
                <h3 className="font-heading text-white uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#FF2D87]" />
                  Usage Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5">
                      Total Vouchers
                    </p>
                    <p className="font-heading text-white text-2xl sm:text-3xl">
                      {coupons.length}
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5">
                      Tickets Used
                    </p>
                    <p className="font-heading text-[#FF2D87] text-2xl sm:text-3xl">
                      {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5">
                      Tickets Remaining
                    </p>
                    <p className="font-heading text-emerald-400 text-2xl sm:text-3xl">
                      {coupons.reduce(
                        (sum, c) => sum + Math.max(0, c.maxUses - c.usedCount),
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5">
                      Active Vouchers
                    </p>
                    <p className="font-heading text-white text-2xl sm:text-3xl">
                      {coupons.filter((c) => isCouponActive(c, now)).length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-4 sm:p-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 min-w-0">
                <div className="min-w-0">
                  <h2 className="font-heading text-white uppercase tracking-wide text-lg sm:text-xl flex items-center gap-2">
                    <TicketPercent className="w-5 h-5 text-[#FF2D87] shrink-0" />
                    Create New Voucher
                  </h2>
                  <p className="text-white/50 text-sm mt-1">
                    Define a custom coupon code, discount %, validity dates, and max tickets.
                  </p>
                </div>
                {!formOpen && (
                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Voucher
                  </button>
                )}
              </div>

              {formOpen && (
                <form onSubmit={handleCreate} className="space-y-4 sm:space-y-5 min-w-0 animate-fade-in">
                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="break-words">{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                    <div className="sm:col-span-2 min-w-0">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
                        <Tag className="w-3 h-3" />
                        Coupon Code <span className="text-white/30">(custom, auto-uppercase)</span>
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. BALIPU20"
                        className="w-full min-w-0 bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60 font-mono tracking-wider"
                        maxLength={32}
                        disabled={submitting}
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
                        <Percent className="w-3 h-3" />
                        Discount Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={percentOff}
                          onChange={(e) => setPercentOff(parseInt(e.target.value || '0', 10))}
                          className="w-full min-w-0 bg-black/50 border border-white/15 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60"
                          disabled={submitting}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-semibold">%</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
                        <Hash className="w-3 h-3" />
                        Max Tickets (Usage Limit)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value || '1', 10))}
                        placeholder="e.g. 50"
                        className="w-full min-w-0 bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60"
                        disabled={submitting}
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
                        <CalendarDays className="w-3 h-3" />
                        Valid From <span className="text-white/30">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full min-w-0 bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60 [color-scheme:dark]"
                        disabled={submitting}
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
                        <Clock className="w-3 h-3" />
                        Valid Until <span className="text-white/30">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full min-w-0 bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60 [color-scheme:dark]"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="flex-1 min-h-11 rounded-full border border-white/20 text-white/80 hover:bg-white/5 font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {submitting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      {submitting ? 'Creating...' : 'Create Voucher'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-4 sm:p-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 min-w-0">
                <div className="min-w-0">
                  <h2 className="font-heading text-white uppercase tracking-wide text-lg sm:text-xl flex items-center gap-2">
                    <TicketPercent className="w-5 h-5 text-[#FF2D87] shrink-0" />
                    Existing Vouchers
                  </h2>
                  <p className="text-white/50 text-sm mt-1">
                    Total: <span className="text-white/70 font-semibold">{coupons.length}</span> voucher{coupons.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchCoupons()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold min-h-10 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 transition-colors disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#FF2D87]" />
                </div>
              ) : coupons.length === 0 ? (
                <div className="border border-dashed border-white/15 rounded-2xl px-6 py-16 text-center">
                  <TicketPercent className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="font-heading text-white uppercase tracking-wide text-lg mb-2">
                    No vouchers yet
                  </p>
                  <p className="text-white/50 text-sm mb-5">
                    Create your first custom discount voucher above.
                  </p>
                  {!formOpen && (
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Voucher
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => {
                    const active = isCouponActive(coupon, now);
                    const remaining = Math.max(0, coupon.maxUses - coupon.usedCount);
                    const usagePct = Math.min(100, (coupon.usedCount / coupon.maxUses) * 100);
                    const isStatic = !!coupon.isStatic;
                    return (
                      <div
                        key={coupon.id}
                        className={`rounded-2xl border p-4 sm:p-5 min-w-0 transition-colors ${
                          active
                            ? isStatic
                              ? 'bg-gradient-to-br from-indigo-950/40 to-black/40 border-indigo-500/20 hover:border-indigo-500/40'
                              : 'bg-black/40 border-white/10 hover:border-[#FF2D87]/30'
                            : 'bg-black/20 border-white/5 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF2D87]/15 border border-[#FF2D87]/30 text-[#FF2D87] font-mono text-base font-bold tracking-widest break-all">
                                <Tag className="w-4 h-4 shrink-0" />
                                {coupon.code}
                              </span>
                              {isStatic && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                  <Lock className="w-3 h-3" />
                                  Static (Built-in)
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  active
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/10 text-white/50 border border-white/15'
                                }`}
                              >
                                {active ? '✓ Active' : '✗ Inactive'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-white/60 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                                <Percent className="w-3 h-3" />
                                {coupon.percentOff}% OFF
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 min-w-0">
                              <div className="bg-black/60 rounded-xl p-3.5 border border-white/10 min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/40 mb-2 flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  Valid From
                                </p>
                                <p className="text-white/80 text-sm font-bold break-words">
                                  {formatDate(coupon.validFrom)}
                                </p>
                              </div>
                              <div className="bg-black/60 rounded-xl p-3.5 border border-white/10 min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/40 mb-2 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  Valid Until
                                </p>
                                <p className="text-white/80 text-sm font-bold break-words">
                                  {formatDate(coupon.validUntil)}
                                </p>
                              </div>
                              <div className="bg-black/60 rounded-xl p-3.5 border border-[#FF2D87]/20 min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#FF2D87]/70 mb-2 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Tickets Used
                                </p>
                                <p className="text-white text-2xl sm:text-3xl font-heading leading-none">
                                  <span className="text-[#FF2D87]">{coupon.usedCount}</span>
                                  <span className="text-white/40 text-base font-semibold mx-1">/</span>
                                  <span className="text-white/80 text-lg font-bold">{coupon.maxUses}</span>
                                </p>
                              </div>
                              <div className="bg-black/60 rounded-xl p-3.5 border border-emerald-500/20 min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-400/70 mb-2 flex items-center gap-1.5">
                                  <TicketPercent className="w-3.5 h-3.5" />
                                  Remaining
                                </p>
                                <p className={`text-2xl sm:text-3xl font-heading leading-none ${
                                  remaining === 0
                                    ? 'text-red-400'
                                    : remaining < Math.ceil(coupon.maxUses * 0.1)
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                }`}>
                                  {remaining}
                                  <span className="text-sm font-semibold ml-1 opacity-75">
                                    ticket{remaining !== 1 ? 's' : ''}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="flex justify-between text-[10px] uppercase tracking-[0.15em] font-bold text-white/40 mb-2">
                                <span>Usage Progress</span>
                                <span>{usagePct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-black rounded-full h-2.5 border border-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    usagePct >= 90
                                      ? 'bg-gradient-to-r from-red-600 to-red-400'
                                      : usagePct >= 60
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                        : 'bg-gradient-to-r from-[#FF2D87] to-[#ff4d9a]'
                                  }`}
                                  style={{ width: `${usagePct}%` }}
                                />
                              </div>
                            </div>

                            <p className="text-[10px] text-white/30 mt-4">
                              Created: {formatDateTime(coupon.createdAt)}
                            </p>
                          </div>

                          <div className="flex sm:flex-col sm:items-end gap-2 shrink-0">
                            {!isStatic ? (
                              <button
                                type="button"
                                onClick={() => handleDelete(coupon)}
                                disabled={deletingId === coupon.id}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                                title="Delete voucher"
                              >
                                {deletingId === coupon.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                <span className="sm:hidden">Delete</span>
                              </button>
                            ) : (
                              <div className="text-[10px] text-indigo-300/60 max-w-[7rem] text-right sm:text-center border border-indigo-500/20 rounded-xl px-3 py-2 bg-indigo-500/5">
                                <Lock className="w-3 h-3 mx-auto mb-1 sm:block hidden" />
                                Built-in coupons cannot be deleted from the admin panel.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}

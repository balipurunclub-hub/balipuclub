'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminShell } from '@/components/admin/AdminShell';

export default function ScannerControlsPage() {
  const [allowFree, setAllowFree] = useState(true);
  const [allowPaid, setAllowPaid] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/admin/scanner-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setAllowFree(data.allowFreeTierScan !== false);
          setAllowPaid(data.allowPaidTierScan !== false);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const toggleFree = async () => {
    const newVal = !allowFree;
    setAllowFree(newVal);
    await fetch('/api/admin/scanner-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowFreeTierScan: newVal }),
    });
  };

  const togglePaid = async () => {
    const newVal = !allowPaid;
    setAllowPaid(newVal);
    await fetch('/api/admin/scanner-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowPaidTierScan: newVal }),
    });
  };

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-white/50">Loading controls...</p>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminShell
        title="Scanner Controls"
        description="Enable or disable ticket scanning for free and paid tiers. Changes apply instantly."
        backHref="/admin"
        maxWidth="2xl"
      >
        <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl overflow-hidden min-w-0">
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FF2D87]/15 border border-[#FF2D87]/30 rounded-full flex items-center justify-center mb-4 text-[#FF2D87]">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <p className="text-white/55 text-sm max-w-md">
              Toggle access for check-in devices in real time.
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 bg-black/40 rounded-2xl border border-white/10 min-w-0">
              <div className="min-w-0">
                <h3 className="font-heading text-white uppercase tracking-wide text-base sm:text-lg">
                  Paid Tier Scanning
                </h3>
                <p className="text-white/45 text-sm mt-1">Allow paid entry tickets to be checked in.</p>
              </div>
              <button
                onClick={togglePaid}
                className={`relative inline-flex h-8 w-14 shrink-0 self-end sm:self-auto items-center rounded-full transition-colors ${
                  allowPaid ? 'bg-[#FF2D87]' : 'bg-white/20'
                }`}
                aria-pressed={allowPaid}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    allowPaid ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 bg-black/40 rounded-2xl border border-white/10 min-w-0">
              <div className="min-w-0">
                <h3 className="font-heading text-white uppercase tracking-wide text-base sm:text-lg">
                  Free Tier Scanning
                </h3>
                <p className="text-white/45 text-sm mt-1">Allow free entry tickets to be checked in.</p>
              </div>
              <button
                onClick={toggleFree}
                className={`relative inline-flex h-8 w-14 shrink-0 self-end sm:self-auto items-center rounded-full transition-colors ${
                  allowFree ? 'bg-[#FF2D87]' : 'bg-white/20'
                }`}
                aria-pressed={allowFree}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    allowFree ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}

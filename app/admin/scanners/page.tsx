'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminShell } from '@/components/admin/AdminShell';
import { Trash2, UserPlus, ShieldAlert } from 'lucide-react';

export default function ScannersPage() {
  const [scanners, setScanners] = useState<{ email: string; role: string; id?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const fetchScanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/scanners');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch scanners');
      setScanners(data.scanners || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch scanners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScanners();
  }, [fetchScanners]);

  const addScanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const email = newEmail.trim().toLowerCase();
    setError('');

    try {
      const res = await fetch('/api/admin/scanners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add scanner');

      setNewEmail('');
      fetchScanners();
    } catch (err) {
      console.error(err);
      setError('Failed to add scanner.');
    }
  };

  const removeScanner = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as a scanner?`)) return;
    setError('');

    try {
      const res = await fetch(`/api/admin/scanners?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove scanner');
      fetchScanners();
    } catch (err) {
      console.error(err);
      setError('Failed to remove scanner.');
    }
  };

  return (
    <AdminRoute>
      <AdminShell
        title="Manage Scanners"
        description="Add or remove staff authorized to scan event tickets."
        backHref="/admin"
        maxWidth="4xl"
      >
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 border border-red-500/30 min-w-0 mb-6">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium break-words">{error}</p>
          </div>
        )}

        <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 p-4 sm:p-6 rounded-2xl min-w-0 mb-6">
          <form onSubmit={addScanner} className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="scanner@example.com"
              className="flex-1 w-full min-w-0 min-h-11 bg-black/50 border border-white/15 rounded-full px-4 text-white placeholder:text-white/35 focus:outline-none focus:border-[#FF2D87]/60"
              required
            />
            <button
              type="submit"
              className="min-h-11 px-5 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold whitespace-nowrap flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Scanner
            </button>
          </form>
        </div>

        <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl overflow-x-auto min-w-0">
          <table className="w-full text-left border-collapse min-w-[300px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em]">
                  Email Address
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-6 text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-white/45">
                    Loading...
                  </td>
                </tr>
              ) : scanners.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-white/45">
                    No scanners added yet.
                  </td>
                </tr>
              ) : (
                scanners.map((scanner) => (
                  <tr key={scanner.id || scanner.email} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6 font-medium text-white break-all max-w-[220px] sm:max-w-none">
                      {scanner.email}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                      <button
                        onClick={() => removeScanner(scanner.email)}
                        className="inline-flex items-center justify-center min-h-11 min-w-11 p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                        title="Remove Scanner"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}

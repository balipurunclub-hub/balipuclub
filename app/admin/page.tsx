'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminRoute } from '@/components/AdminRoute';
import { RegistrationsTable } from '@/components/admin/RegistrationsTable';
import { ExportCSVButton } from '@/components/admin/ExportCSVButton';
import { ShieldCheck, Users, IndianRupee, RefreshCw } from 'lucide-react';
import type { Registration } from '@/types';

function AdminDashboardInner() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: Registration[] = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data() as Registration);
      });
      setRegistrations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch registrations. Check Firestore rules or permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const totalRevenue = registrations
    .filter((reg) => reg.paymentStatus === 'paid')
    .reduce((acc, _reg) => acc + parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE || '200'), 0);

  const paidCount = registrations.filter((reg) => reg.paymentStatus === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Total Registrations</p>
            <h3 className="text-2xl font-bold text-white">{registrations.length}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-green-500/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Successful Payments</p>
            <h3 className="text-2xl font-bold text-white">{paidCount}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#F5841F]/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-[#F5841F]/20 border border-[#F5841F]/30 flex items-center justify-center text-[#F5841F] shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-lg font-bold text-white">Registration Data</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <ExportCSVButton data={registrations} />
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchRegistrations} className="btn-secondary">Try Again</button>
        </div>
      ) : loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
        </div>
      ) : (
        <RegistrationsTable data={registrations} />
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#0D0D2B]">
        {/* Spacer for fixed navbar */}
        <div className="h-28" />

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-8 animate-fade-in">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#F5841F] blur-lg opacity-20 rounded-full" />
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#F5841F]/20 to-[#F5841F]/5 border border-[#F5841F]/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(245,132,31,0.15)]">
                  <ShieldCheck className="w-6 h-6 text-[#F5841F]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading tracking-wide text-white leading-tight drop-shadow-md">ADMIN DASHBOARD</h1>
                <p className="text-slate-400 text-sm mt-0.5">Manage Balipu x Nexus registrations</p>
              </div>
            </div>
          </div>

          <AdminDashboardInner />
        </div>
      </div>
    </AdminRoute>
  );
}

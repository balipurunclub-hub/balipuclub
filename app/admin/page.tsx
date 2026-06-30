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
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-600 text-sm font-medium">Total Registrations</p>
            <h3 className="text-2xl font-bold text-[#1B1B4D]">{registrations.length}</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-600 text-sm font-medium">Successful Payments</p>
            <h3 className="text-2xl font-bold text-[#1B1B4D]">{paidCount}</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-[#1B1B4D]">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-lg font-bold text-[#1B1B4D]">Registration Data</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="btn-secondary text-sm py-1.5 px-3 rounded-lg flex items-center gap-1.5"
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
        <div className="flex items-center justify-center py-20 card">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-[calc(100vh-64px)] p-4 md:p-8">
        <div className="mx-auto max-w-7xl animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1B1B4D] leading-tight">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">Manage Balipu Run registrations</p>
            </div>
          </div>

          <AdminDashboardInner />
        </div>
      </div>
    </AdminRoute>
  );
}

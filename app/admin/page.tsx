'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminRoute } from '@/components/AdminRoute';
import { RegistrationsTable } from '@/components/admin/RegistrationsTable';
import { ExportCSVButton } from '@/components/admin/ExportCSVButton';
import { ShieldCheck, Users, IndianRupee, RefreshCw, QrCode, Lock, Mail, CheckSquare, X, CheckCircle2, UserCheck } from 'lucide-react';
import type { Registration } from '@/types';
import Link from 'next/link';

function AdminDashboardInner() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Check-in modal state
  const [checkinTarget, setCheckinTarget] = useState<Registration | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchRegistrations = useCallback(() => {
    setLoading(true);
    setError('');
    const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Registration[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ ...docSnap.data(), uid: docSnap.id } as Registration);
        });
        setRegistrations(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to fetch registrations. Check Firestore rules or permissions.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = fetchRegistrations();
    return () => unsubscribe?.();
  }, [fetchRegistrations]);


  const totalCount = registrations.length;
  const freeCount = registrations.filter(r => r.entryType === 'free').length;
  const paidEntryCount = registrations.filter(r => r.entryType !== 'free').length;
  const checkedInCount = registrations.filter(r => r.attended).length;

  const handleManualCheckIn = (reg: Registration) => {
    setCheckinTarget(reg);
  };

  const confirmCheckIn = async () => {
    if (!checkinTarget) return;
    setIsCheckingIn(true);
    try {
      const docRef = doc(db, 'registrations', checkinTarget.uid);
      await updateDoc(docRef, {
        attended: true,
        attendedAt: serverTimestamp()
      });
      // update local state instantly
      setRegistrations(prev => prev.map(r => r.uid === checkinTarget.uid ? { ...r, attended: true } : r));
      setCheckinTarget(null);
    } catch (err) {
      console.error(err);
      alert('Failed to check in manually.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Registrations</p>
            <h3 className="text-2xl font-bold text-white">{totalCount}</h3>
          </div>
        </div>

        {/* Paid Entries */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#F5841F]/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-[#F5841F]/20 border border-[#F5841F]/30 flex items-center justify-center text-[#F5841F] shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Paid Entries</p>
            <h3 className="text-2xl font-bold text-white">{paidEntryCount}</h3>
          </div>
        </div>

        {/* Free Entries */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-green-500/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Free Entries</p>
            <h3 className="text-2xl font-bold text-white">{freeCount}</h3>
          </div>
        </div>

        {/* Checked In */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-5 flex items-center gap-4 shadow-lg">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Checked In</p>
            <h3 className="text-2xl font-bold text-white">{checkedInCount} <span className="text-sm text-slate-400 font-normal">/ {totalCount}</span></h3>
          </div>
        </div>

      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/admin/send-emails" className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-[#F5841F] hover:bg-[#F5841F]/90 text-white transition-all shadow-[0_0_15px_rgba(245,132,31,0.2)]">
          <Mail className="w-4 h-4" />
          Send Emails
        </Link>
        <Link href="/scan" className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md">
          <QrCode className="w-4 h-4" />
          Open Scanner
        </Link>
      </div>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Registration Data</h2>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">🔴 Live — updates automatically</p>
        </div>
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      ) : (
        <RegistrationsTable data={registrations} onManualCheckin={handleManualCheckIn} />
      )}

      {/* Manual Check-in Modal */}
      {checkinTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up mx-2">
            <div className="relative p-4 sm:p-6 text-center border-b border-slate-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-[#1B1B4D] mb-1">Manual Check-In</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
                <p className="text-slate-500 font-mono text-xs sm:text-sm break-all px-4">{checkinTarget.ticketId}</p>
                {checkinTarget.entryType && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${checkinTarget.entryType === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>
                    {checkinTarget.entryType === 'free' ? 'FREE ENTRY' : 'PAID ENTRY'}
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => !isCheckingIn && setCheckinTarget(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                disabled={isCheckingIn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Name</p>
                  <p className="font-semibold text-slate-800 break-words">{checkinTarget.name}</p>
                </div>
                {checkinTarget.entryType !== 'free' && (
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Jersey Size</p>
                    <p className="font-semibold text-slate-800">{checkinTarget.jerseySize || 'N/A'}</p>
                  </div>
                )}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Age / Gender</p>
                  <p className="font-semibold text-slate-800">{checkinTarget.age} • {checkinTarget.gender}</p>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">BIB Number</p>
                  <p className="font-semibold text-slate-800">{checkinTarget.bibNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setCheckinTarget(null)}
                  className="btn-secondary flex-1 bg-white hover:bg-slate-100 text-slate-700"
                  disabled={isCheckingIn}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmCheckIn}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Check-In
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
      <div className="min-h-screen bg-[#0D0D2B]">
        {/* Spacer for fixed navbar */}
        <div className="h-20 sm:h-28" />

        {/* Content */}
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-8 animate-fade-in">
          {/* Page header */}
          <div className="flex items-center justify-between mb-4 sm:mb-8 pb-4 sm:pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <div className="absolute inset-0 bg-[#F5841F] blur-lg opacity-20 rounded-full" />
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#F5841F]/20 to-[#F5841F]/5 border border-[#F5841F]/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(245,132,31,0.15)]">
                  <ShieldCheck className="w-6 h-6 text-[#F5841F]" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-heading tracking-wide text-white leading-tight drop-shadow-md">ADMIN DASHBOARD</h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Manage Balipu x Nexus registrations</p>
              </div>
            </div>
          </div>

          <AdminDashboardInner />
        </div>
      </div>
    </AdminRoute>
  );
}

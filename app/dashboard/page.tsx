'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ClipboardList,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import type { Registration } from '@/types';

function StatusCard({ status }: { status: Registration['paymentStatus'] }) {
  if (status === 'paid') {
    return (
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-5">
        <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
        <div>
          <p className="font-semibold text-green-600">Registration Confirmed</p>
          <p className="text-slate-600 text-sm">Your payment was successful. See you there!</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-5">
        <XCircle className="w-8 h-8 text-red-500 shrink-0" />
        <div>
          <p className="font-semibold text-red-600">Payment Failed</p>
          <p className="text-slate-600 text-sm">Your last payment attempt failed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
      <Clock className="w-8 h-8 text-yellow-500 shrink-0" />
      <div>
        <p className="font-semibold text-yellow-600">Payment Pending</p>
        <p className="text-slate-600 text-sm">Complete payment to confirm your registration.</p>
      </div>
    </div>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRegistration = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'registrations', user.uid));
      if (!snap.exists()) {
        setRegistration(null);
      } else {
        setRegistration(snap.data() as Registration);
      }
    } catch {
      setError('Failed to load your registration.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchRegistration} className="btn-secondary gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center py-16">
        <ClipboardList className="w-14 h-14 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[#1B1B4D] mb-2">Not registered yet</h2>
        <p className="text-slate-600 mb-6">Complete your registration to get started.</p>
        <Link href="/register" className="btn-primary">
          Register Now
        </Link>
      </div>
    );
  }

  const fields: [string, string][] = [
    ['BIB Number', registration.bibNumber ? registration.bibNumber.toString() : 'N/A'],
    ['Name', registration.name],
    ['Email', registration.email],
    ['Phone', registration.phone],
    ['Age', registration.age?.toString() || 'N/A'],
    ['Jersey Size', registration.jerseySize || 'N/A'],
  ];

  return (
    <div className="space-y-6">
      <StatusCard status={registration.paymentStatus} />

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Your Details
        </h3>
        {fields.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800 font-medium">{value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center text-sm py-2">
          <span className="text-slate-500">Payment Status</span>
          <span className={`badge-${registration.paymentStatus}`}>
            {registration.paymentStatus === 'paid' && '✓ '}
            {registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1)}
          </span>
        </div>
        {registration.paymentId && (
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-slate-500">Payment ID</span>
            <span className="text-slate-400 font-mono text-xs">{registration.paymentId}</span>
          </div>
        )}
      </div>

      {registration.paymentStatus !== 'paid' && (
        <button
          onClick={() => router.push('/payment')}
          className="btn-primary w-full"
        >
          <CreditCard className="w-4 h-4" />
          {registration.paymentStatus === 'failed' ? 'Retry Payment' : 'Complete Payment'}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-3xl -z-10" />

        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#1B1B4D] mb-1">My Registration</h1>
            <p className="text-slate-600 text-sm">Balipu x Nexus — 12 July 2026</p>
          </div>

          <DashboardInner />
        </div>
      </div>
    </ProtectedRoute>
  );
}

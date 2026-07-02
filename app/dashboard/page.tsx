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
  ShieldCheck,
  ScanLine,
} from 'lucide-react';
import type { Registration } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

function StatusCard({ status }: { status: Registration['paymentStatus'] }) {
  if (status === 'paid') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="font-semibold text-green-600">Registration Confirmed</p>
            <p className="text-slate-600 text-sm">Your payment was successful. See you there!</p>
          </div>
        </div>

        <div className="pt-2 border-t border-green-500/10">
          <a
            href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm w-full sm:w-auto justify-center"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            Join WhatsApp Group
          </a>
        </div>
        
        {/* QR Code Section */}
        {status === 'paid' && (
          <div className="pt-4 border-t border-green-500/10 flex flex-col items-center justify-center">
             <p className="text-sm text-slate-500 font-medium mb-3">Your Event Ticket QR</p>
             <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-100">
               {/* We need the ticketId to render the QR. We'll pass it in props. */}
             </div>
          </div>
        )}
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
      <div className="space-y-6">
        <div className="card p-6 animate-pulse">
          <div className="h-6 w-1/3 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-4 w-4/6 bg-slate-200 rounded" />
          </div>
        </div>
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
    ['Ticket ID', registration.ticketId || (registration.bibNumber ? registration.bibNumber.toString() : 'Pending Payment')],
    ['Name', registration.name],
    ['Email', registration.email],
    ['Phone', registration.phone],
    ['Age', registration.age?.toString() || 'N/A'],
    ['Jersey Size', registration.jerseySize || 'N/A'],
  ];

  return (
    <div className="space-y-6">
      {registration.paymentStatus === 'paid' ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-600">Registration Confirmed</p>
              <p className="text-slate-600 text-sm">Your payment was successful. See you there!</p>
            </div>
          </div>
          
          {registration.ticketId && (
            <div className="pt-6 border-t border-green-500/10 flex flex-col items-center justify-center">
              <p className="text-sm text-slate-500 font-medium mb-3 uppercase tracking-widest">Your Event Ticket</p>
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100 mb-2">
                <QRCodeSVG value={registration.ticketId} size={180} level="H" includeMargin={false} />
              </div>
              <p className="font-mono text-xl font-bold tracking-widest text-[#1B1B4D]">{registration.ticketId}</p>
            </div>
          )}

          <div className="pt-4 border-t border-green-500/10">
            <a
              href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm w-full sm:w-auto justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Join WhatsApp Group
            </a>
          </div>
        </div>
      ) : (
        <StatusCard status={registration.paymentStatus} />
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Your Details
        </h3>
        {fields.map(([label, value]) => (
          <div key={label} className="flex justify-between items-start sm:items-center gap-4 text-sm py-2 border-b border-slate-100 last:border-0 min-w-0">
            <span className="text-slate-500 shrink-0">{label}</span>
            <span className="text-slate-800 font-medium text-right break-words min-w-0">{value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center gap-4 text-sm py-2 min-w-0">
          <span className="text-slate-500 shrink-0">Payment Status</span>
          <span className={`badge-${registration.paymentStatus} shrink-0`}>
            {registration.paymentStatus === 'paid' && '✓ '}
            {registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1)}
          </span>
        </div>
        {registration.paymentId && (
          <div className="flex justify-between items-start sm:items-center gap-4 text-sm py-2 min-w-0">
            <span className="text-slate-500 shrink-0">Payment ID</span>
            <span className="text-slate-400 font-mono text-xs text-right break-all min-w-0">{registration.paymentId}</span>
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
  const { user, isScanner } = useAuth();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'balipurunclub@gmail.com';
  const isAdmin = user?.email === adminEmail;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-3xl -z-10" />

        <div className="w-full max-w-lg animate-fade-in flex flex-col gap-6">
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#1B1B4D] mb-1">My Registration</h1>
              <p className="text-slate-600 text-sm">Balipu x Nexus — 12 July 2026</p>
            </div>

            <DashboardInner />
          </div>

          {isAdmin && (
            <div className="text-center mt-4">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1B1B4D] hover:bg-[#2D1B36] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </span>
                Go to Admin Dashboard
              </Link>
            </div>
          )}

          {isScanner && (
            <div className="text-center mt-2">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <ScanLine className="w-4 h-4 text-white" />
                Open QR Scanner
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

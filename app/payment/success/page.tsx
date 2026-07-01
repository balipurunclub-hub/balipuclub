'use client';

import Link from 'next/link';
import { CheckCircle2, Download, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function SuccessInner() {
  const { user } = useAuth();
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'TechFest 2025';
  const eventDate = process.env.NEXT_PUBLIC_EVENT_DATE || 'August 15, 2025';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-green-600/10 blur-3xl -z-10" />

      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Success icon with glow */}
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl" />
          <div className="relative w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#1B1B4D] mb-2">You&apos;re In! 🎉</h1>
        <p className="text-slate-600 mb-8">
          Your registration for <strong className="text-[#1B1B4D]">{eventName}</strong> is confirmed.
          See you on <strong className="text-violet-600">{eventDate}</strong>!
        </p>

        <div className="bg-linear-to-br from-green-50 to-emerald-50/50 border border-green-200/60 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto shadow-lg shadow-green-100/30">
          <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Join our WhatsApp Community
          </h3>
          <p className="text-green-700/80 text-sm mb-5 leading-relaxed">Stay updated with the latest event announcements and connect with fellow runners.</p>
          <a
            href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Join WhatsApp Group
          </a>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8 text-left space-y-4 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -z-10 opacity-60"></div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Confirmation Details
          </h3>
          <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-800 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
            <span className="text-slate-500">Status</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">✓ PAID</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-3">
            <span className="text-slate-500">Event</span>
            <span className="text-slate-800 font-medium">{eventName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Date</span>
            <span className="text-slate-800 font-medium">{eventDate}</span>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard" className="btn-primary w-full py-3.5 shadow-lg shadow-[#F5841F]/20 flex items-center justify-center gap-2 whitespace-nowrap">
            <LayoutDashboard className="w-4 h-4" />
            My Registration
          </Link>
          <Link href="/" className="btn-secondary w-full py-3.5 flex items-center justify-center gap-2 whitespace-nowrap bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
          <p className="text-slate-400 text-sm">
            A confirmation has been sent to your registered email.
          </p>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Print this page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <ProtectedRoute>
      <SuccessInner />
    </ProtectedRoute>
  );
}

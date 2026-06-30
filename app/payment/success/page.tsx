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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
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

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 text-left space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Confirmation Details
          </h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-800 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <span className="badge-paid">✓ Paid</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Event</span>
            <span className="text-slate-800 font-medium">{eventName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Date</span>
            <span className="text-slate-800 font-medium">{eventDate}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="btn-primary flex-1">
            <LayoutDashboard className="w-4 h-4" />
            My Registration
          </Link>
          <Link href="/" className="btn-secondary flex-1">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        <p className="text-slate-500 text-xs mt-6">
          A confirmation has been sent to your registered email.
        </p>

        <button
          onClick={() => window.print()}
          className="mt-3 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Print this page
        </button>
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Script from 'next/script';
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Registration } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function PaymentPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  const fetchRegistration = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'registrations', user.uid));
      if (!snap.exists()) {
        router.replace('/register');
        return;
      }
      setRegistration(snap.data() as Registration);
    } catch {
      setError('Failed to load registration. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  const handlePayment = async () => {
    if (!user || !registration || !scriptReady) return;
    setError('');
    setPaymentLoading(true);

    try {
      // 1. Get Firebase ID token
      const idToken = await user.getIdToken();

      // 2. Create Razorpay order
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!orderRes.ok) {
        const { error: err } = await orderRes.json();
        throw new Error(err || 'Failed to create order');
      }

      const { orderId, amount, currency } = await orderRes.json();

      // 3. Open Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount,
        currency,
        name: process.env.NEXT_PUBLIC_EVENT_NAME || 'TechFest 2025',
        description: 'Event Registration Fee',
        order_id: orderId,
        prefill: {
          name: registration.name,
          email: registration.email,
          contact: registration.phone,
        },
        theme: { color: '#F5841F' },
        handler: async (response: RazorpayResponse) => {
          // 4. Verify payment on server
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              router.push('/payment/success');
            } else {
              const { error: verifyErr } = await verifyRes.json();
              setError(verifyErr || 'Payment verification failed.');
            }
          } catch {
            setError('Verification request failed. Please contact support.');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to initiate payment.');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-8 animate-pulse space-y-6">
        <div className="h-8 w-1/3 bg-slate-200 rounded mx-auto" />
        <div className="h-4 w-2/3 bg-slate-200 rounded mx-auto" />
        <div className="h-32 w-full bg-slate-200 rounded" />
      </div>
    );
  }

  if (registration?.paymentStatus === 'paid') {
    return (
      <div className="text-center py-16 animate-fade-in">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1B1B4D] mb-2">Payment Complete!</h2>
        <div className="text-slate-600 mb-6 space-y-2">
          <p>Your registration is confirmed.</p>
          <p className="text-sm">A confirmation email will be sent to you shortly. Please check your spam folder as well.</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-green-800 mb-2">Join our WhatsApp Community!</h3>
          <p className="text-green-700 text-sm mb-4">Stay updated with the latest event announcements and connect with fellow runners.</p>
          <a
            href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Join WhatsApp Group
          </a>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-primary">
          View My Registration
        </button>
      </div>
    );
  }

  const fee = parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE || '200');

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError('')}
            className="ml-auto text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Registration summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-2.5">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Your Details
        </h3>
        {[
          ['Name', registration?.name],
          ['Email', registration?.email],
          ['Phone', registration?.phone],
          ['Age', registration?.age?.toString()],
          ['Jersey', registration?.jerseySize],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800 font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Fee */}
      <div className="flex justify-between items-center bg-[#F5841F]/10 border border-[#F5841F]/20 rounded-xl px-5 py-4 mb-6">
        <span className="text-slate-700 font-medium">Registration Fee</span>
        <span className="text-2xl font-bold text-[#1B1B4D]">₹{fee}</span>
      </div>

      {registration?.paymentStatus === 'failed' && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-4">
          <RefreshCw className="w-4 h-4" />
          Your last payment attempt failed. You can try again below.
        </div>
      )}

      <button
        id="btn-pay-now"
        onClick={handlePayment}
        disabled={paymentLoading || !scriptReady}
        className="btn-primary w-full"
      >
        {paymentLoading ? (
          <>
            <div className="spinner" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ₹{fee} Securely
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-slate-600 text-xs mt-4">
        <ShieldCheck className="w-3.5 h-3.5" />
        Secured by Razorpay — 256-bit SSL encryption
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#F5841F]/15 blur-3xl -z-10" />

        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F5841F]/20 border border-[#F5841F]/30 mb-4">
              <CreditCard className="w-7 h-7 text-[#F5841F]" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">Complete Payment</h1>
            <p className="text-slate-500 text-sm">Step 2 of 2 — Secure checkout</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-1.5 rounded-full bg-[#F5841F]" />
            <div className="flex-1 h-1.5 rounded-full bg-[#F5841F]" />
          </div>

          <div className="card p-8">
            <PaymentPageInner />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

const formSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .max(15, 'Enter a valid phone number')
    .regex(/^[0-9+\-\s]+$/, 'Enter a valid phone number'),
  age: z
    .string()
    .min(1, 'Enter age')
    .transform((v) => Number(v))
    .refine((n) => !Number.isNaN(n) && n >= 5 && n <= 100, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Prefer not to say'], {
    message: 'Select gender',
  }),
  city: z.string().min(2, 'Enter your city'),
  emergencyContact: z
    .string()
    .min(10, 'Enter a valid emergency contact')
    .max(15, 'Enter a valid emergency contact'),
  source: z.string().min(1, 'Tell us how you heard about us'),
  jerseySize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], {
    message: 'Select jersey size',
  }),
  declarationAgreed: z.boolean().refine((v) => v === true, {
    message: 'You must agree to the declaration',
  }),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const fieldClass =
  'w-full min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#FF2D87]/50 focus:border-[#FF2D87]/40 transition-colors';
const labelClass = 'block text-sm font-semibold text-white/70 mb-2 break-words';
const errorClass = 'text-sm text-red-400 mt-1 break-words';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'] as const;
const JERSEY_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
const SOURCE_OPTIONS = [
  'Instagram',
  'WhatsApp',
  'Friend / Family',
  'College',
  'Previous Balipu Event',
  'Other',
];

type PricingResponse = {
  active: {
    feeRupees: number;
    entryType: 'free' | 'paid';
  };
};

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function AloysiusRegistrationForm() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [submitError, setSubmitError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pricingError, setPricingError] = useState('');
  const [pricingLoading, setPricingLoading] = useState(true);
  const paymentDoneRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: undefined,
      jerseySize: undefined,
      source: '',
      declarationAgreed: false,
      age: '',
    },
  });

  const loadPricing = async () => {
    try {
      setPricingError('');
      const res = await fetch('/api/register/pricing', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load pricing');
      setPricing(data);
    } catch (err: unknown) {
      setPricingError(err instanceof Error ? err.message : 'Could not load pricing');
    } finally {
      setPricingLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
    const interval = setInterval(loadPricing, 15000);
    return () => clearInterval(interval);
  }, []);

  const feeRupees = pricing?.active.feeRupees ?? null;
  const isFree = pricing?.active.entryType === 'free';

  const failRegistration = (message?: string) => {
    const msg = message || 'Registration not completed';
    setSubmitError(msg);
    toastError(msg);
    setIsPaying(false);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError('');
    setIsPaying(true);
    paymentDoneRef.current = false;

    try {
      const orderRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderData.code === 'FREE_SLOTS_FULL') {
          await loadPricing();
        }
        throw new Error(orderData.error || 'Registration not completed');
      }

      // Free phase: ticket already issued
      if (orderData.free) {
        paymentDoneRef.current = true;
        success('Registration successful');
        setTimeout(() => router.push(`/ticket/${orderData.uid}`), 700);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error('Registration not completed');
      }

      if (!orderData.key) {
        throw new Error('Registration not completed');
      }

      const rzp = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Balipu Run Club',
        description: `${orderData.pricing?.label || 'Balipu x Aloysius'} Registration`,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#FF2D87' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch('/api/register/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registrationId: orderData.registrationId,
                ...response,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Registration not completed');
            }
            paymentDoneRef.current = true;
            success('Registration successful');
            setTimeout(() => router.push(`/ticket/${verifyData.uid}`), 700);
          } catch (err: unknown) {
            failRegistration(
              err instanceof Error ? err.message : 'Registration not completed'
            );
          }
        },
        modal: {
          ondismiss: () => {
            if (!paymentDoneRef.current) {
              failRegistration('Registration not completed');
            } else {
              setIsPaying(false);
            }
          },
        },
      });

      rzp.open();
    } catch (err: unknown) {
      failRegistration(err instanceof Error ? err.message : 'Registration not completed');
    }
  };

  const busy = isSubmitting || isPaying;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 w-full min-w-0" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
        <div className="sm:col-span-2 min-w-0">
          <label className={labelClass} htmlFor="name">
            Full Name *
          </label>
          <input id="name" className={fieldClass} placeholder="Your full name" {...register('name')} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="email">
            Email *
          </label>
          <input
            id="email"
            type="email"
            className={fieldClass}
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="phone">
            Phone *
          </label>
          <input
            id="phone"
            className={fieldClass}
            placeholder="10-digit mobile"
            {...register('phone')}
          />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="age">
            Age *
          </label>
          <input
            id="age"
            type="number"
            className={fieldClass}
            placeholder="Age"
            {...register('age')}
          />
          {errors.age && <p className={errorClass}>{errors.age.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="gender">
            Gender *
          </label>
          <select id="gender" className={fieldClass} defaultValue="" {...register('gender')}>
            <option value="" disabled className="bg-[#0a0a0a]">
              Select gender
            </option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g} className="bg-[#0a0a0a]">
                {g}
              </option>
            ))}
          </select>
          {errors.gender && <p className={errorClass}>{errors.gender.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="city">
            City *
          </label>
          <input id="city" className={fieldClass} placeholder="Mangaluru" {...register('city')} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="emergencyContact">
            Emergency Contact *
          </label>
          <input
            id="emergencyContact"
            className={fieldClass}
            placeholder="Emergency phone number"
            {...register('emergencyContact')}
          />
          {errors.emergencyContact && (
            <p className={errorClass}>{errors.emergencyContact.message}</p>
          )}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="source">
            How did you hear about us? *
          </label>
          <select id="source" className={fieldClass} defaultValue="" {...register('source')}>
            <option value="" disabled className="bg-[#0a0a0a]">
              Select source
            </option>
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-[#0a0a0a]">
                {opt}
              </option>
            ))}
          </select>
          {errors.source && <p className={errorClass}>{errors.source.message}</p>}
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="jerseySize">
            Jersey Size *
          </label>
          <select
            id="jerseySize"
            className={fieldClass}
            defaultValue=""
            {...register('jerseySize')}
          >
            <option value="" disabled className="bg-[#0a0a0a]">
              Select size
            </option>
            {JERSEY_OPTIONS.map((size) => (
              <option key={size} value={size} className="bg-[#0a0a0a]">
                {size}
              </option>
            ))}
          </select>
          {errors.jerseySize && <p className={errorClass}>{errors.jerseySize.message}</p>}
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 cursor-pointer min-w-0">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black text-[#FF2D87] focus:ring-[#FF2D87]"
          {...register('declarationAgreed')}
        />
        <span className="text-sm text-white/70 leading-relaxed break-words min-w-0">
          I declare that the information provided is accurate. I understand the event involves
          physical activity and participate at my own risk. I agree to follow all event guidelines
          set by Balipu Run Club. *
        </span>
      </label>
      {errors.declarationAgreed && (
        <p className={errorClass}>{errors.declarationAgreed.message}</p>
      )}

      {pricingError && !pricing && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 break-words">
          {pricingError}
        </div>
      )}

      {submitError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 break-words">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || pricingLoading}
        className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-7 py-4 text-sm sm:text-base font-semibold text-white hover:bg-[#ff4d9a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </>
        ) : isFree ? (
          <>Register for Free</>
        ) : feeRupees != null ? (
          <>Register & Pay ₹{feeRupees}</>
        ) : (
          <>Register</>
        )}
      </button>

      <p className="text-center text-xs text-white/40 break-words">
        {isFree
          ? 'Free spots are limited. Your ticket is issued instantly after you submit.'
          : 'Secure payment via Razorpay. You will receive your ticket after successful payment.'}
      </p>
    </form>
  );
}

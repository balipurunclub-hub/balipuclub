'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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

const STEPS = [
  { id: 0, label: 'You', fields: ['name', 'email', 'phone', 'age', 'gender'] as const },
  {
    id: 1,
    label: 'Details',
    fields: ['city', 'emergencyContact', 'source', 'jerseySize'] as const,
  },
  { id: 2, label: 'Confirm', fields: ['declarationAgreed'] as const },
] as const;

type PricingResponse = {
  active: {
    feeRupees: number;
    entryType: 'free' | 'paid';
  };
  registrationOpen?: boolean;
  scheduledUnlockAt?: string;
  scheduledUnlockLabel?: string;
  coupon?: {
    offerAvailable: boolean;
    remainingUses: number;
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
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pricingError, setPricingError] = useState('');
  const [pricingLoading, setPricingLoading] = useState(true);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplying, setCouponApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    feeRupees: number;
    originalFeeRupees: number;
  } | null>(null);
  const [couponFormOpen, setCouponFormOpen] = useState(false);
  const urlCouponAppliedRef = useRef(false);
  const paymentDoneRef = useRef(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
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
    mode: 'onTouched',
  });

  const loadPricing = async () => {
    try {
      setPricingError('');
      const res = await fetch('/api/register/pricing', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load pricing');
      setPricing(data);

      if (data.active?.entryType === 'free') {
        setAppliedCoupon(null);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll pricing; coupon prompt once
  }, []);

  const applyCouponByCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/register/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Invalid coupon code.');
      }
      setAppliedCoupon({
        code: data.couponCode,
        feeRupees: data.feeRupees,
        originalFeeRupees: data.originalFeeRupees,
      });
      return true;
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error('Invalid coupon code.');
    }
  };

  useEffect(() => {
    if (urlCouponAppliedRef.current) return;
    if (!pricing || pricingLoading) return;
    let code: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        code = params.get('coupon');
      } catch {
        code = null;
      }
    }
    if (!code) {
      urlCouponAppliedRef.current = true;
      return;
    }
    urlCouponAppliedRef.current = true;
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setCouponInput(normalized);
    applyCouponByCode(normalized)
      .then(() => {
        success(`Coupon ${normalized} applied`);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Coupon not applied';
        setCouponError(msg);
        toastError(msg);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after pricing loaded on client
  }, [pricing, pricingLoading]);

  const applyCouponCode = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }
    setCouponApplying(true);
    setCouponError('');
    try {
      const res = await fetch('/api/register/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Invalid coupon code.');
      }
      setAppliedCoupon({
        code: data.couponCode,
        feeRupees: data.feeRupees,
        originalFeeRupees: data.originalFeeRupees,
      });
      setCouponModalOpen(false);
      success(`Coupon applied — pay ₹${data.feeRupees}`);
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon code.');
    } finally {
      setCouponApplying(false);
    }
  };

  const scrollFormIntoView = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goNext = async () => {
    const fields = [...STEPS[step].fields];
    const ok = await trigger(fields as (keyof FormInput)[]);
    if (!ok) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollFormIntoView();
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    scrollFormIntoView();
  };

  const feeRupees = appliedCoupon?.feeRupees ?? pricing?.active.feeRupees ?? null;
  const baseFeeRupees = pricing?.active.feeRupees ?? null;
  const isFree = pricing?.active.entryType === 'free';
  const registrationLocked = !pricingLoading && !!pricing && pricing.registrationOpen === false;
  const unlockLabel = pricing?.scheduledUnlockLabel || '7 September 2026, 12:00 AM IST';
  const couponOfferAvailable = !!pricing?.coupon?.offerAvailable;

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
        body: JSON.stringify({
          ...values,
          ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderData.code === 'FREE_SLOTS_FULL') {
          await loadPricing();
        }
        if (orderData.code === 'REGISTRATION_LOCKED') {
          await loadPricing();
        }
        throw new Error(orderData.error || 'Registration not completed');
      }

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
  const isLast = step === STEPS.length - 1;

  if (registrationLocked) {
    return (
      <div className="text-center py-6 sm:py-10 px-2 space-y-4">
        <p className="text-[#FF2D87] text-xs font-semibold tracking-[0.25em] uppercase">
          Registration locked
        </p>
        <h2 className="font-heading text-white uppercase text-2xl sm:text-3xl tracking-wide">
          Opens soon
        </h2>
        <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          Balipu x Aloysius registration opens on{' '}
          <span className="text-white font-semibold">{unlockLabel}</span>. Check back then to
          secure your spot.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 sm:space-y-6 w-full min-w-0"
      noValidate
    >
      <div ref={formTopRef} className="scroll-mt-24">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    i <= step ? 'bg-[#FF2D87]' : 'bg-white/10'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    i === step ? 'text-[#FF2D87]' : i < step ? 'text-white/50' : 'text-white/30'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/40">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step 1 — You */}
        {step === 0 && (
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
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
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
        )}

        {/* Step 3 — Confirm */}
        {step === 2 && (
          <div className="space-y-5">
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 cursor-pointer min-w-0">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black text-[#FF2D87] focus:ring-[#FF2D87]"
                {...register('declarationAgreed')}
              />
              <span className="text-sm text-white/70 leading-relaxed break-words min-w-0">
                I declare that the information provided is accurate. I understand the event involves
                physical activity and participate at my own risk. I agree to follow all event
                guidelines set by Balipu Run Club. *
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

            {!isFree && feeRupees != null && (
              <div className="rounded-xl border border-[#FF2D87]/25 bg-[#FF2D87]/5 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#FF2D87]/80 mb-1">
                      Registration fee
                    </p>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white/50">
                          <span className="line-through">₹{appliedCoupon.originalFeeRupees}</span>
                        </p>
                        <p className="text-xl sm:text-2xl font-heading text-white">
                          ₹{appliedCoupon.feeRupees}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                          {appliedCoupon.code} applied
                        </span>
                      </div>
                    ) : (
                      <p className="text-xl sm:text-2xl font-heading text-white">
                        ₹{feeRupees}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <label htmlFor="step3-coupon" className="block text-[11px] font-bold tracking-[0.25em] uppercase text-white/60">
                    Have a coupon code?
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="step3-coupon"
                      type="text"
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}

                      value={couponInput}
                      disabled={couponApplying}
                      onChange={(e) => {
                        if (appliedCoupon) setAppliedCoupon(null);
                        setCouponError('');
                        setCouponInput(e.target.value.toUpperCase());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyCouponCode();
                        }
                      }}
                      className="flex-1 min-w-0 rounded-xl border border-white/10 bg-black px-4 py-3 text-white placeholder:text-white/30 text-sm font-medium tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-[#FF2D87]/50 focus:border-[#FF2D87]/50 disabled:opacity-60"
                    />
                    <div className="flex gap-2">
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponError('');
                            success('Coupon removed');
                          }}
                          className="shrink-0 inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 min-w-[110px] text-sm font-semibold text-white/80 hover:border-white/30 hover:text-white transition-colors"
                        >
                          Remove
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={applyCouponCode}
                        disabled={couponApplying || !couponInput.trim()}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF2D87] px-4 sm:px-5 py-3 min-w-[90px] text-sm font-bold text-white hover:bg-[#ff4d9a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {couponApplying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Applying…
                          </>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  </div>
                  {couponError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400"
                    >
                      {couponError}
                    </motion.p>
                  )}
                  {appliedCoupon && !couponError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-emerald-400"
                    >
                      Coupon {appliedCoupon.code} applied — you save ₹
                      {Number(appliedCoupon.originalFeeRupees) - Number(appliedCoupon.feeRupees)}
                    </motion.p>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-white/40 break-words">
              {isFree
                ? 'Free spots are limited. Your ticket is issued instantly after you submit.'
                : 'Secure payment via Razorpay. You will receive your ticket after successful payment.'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={busy}
            className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:border-[#FF2D87]/40 hover:text-white transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div className="hidden sm:block sm:flex-1" />
        )}

        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            className="w-full sm:flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FF2D87] px-7 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-[#ff4d9a] transition-colors disabled:opacity-60"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={busy || pricingLoading}
            className="w-full sm:flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-7 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-[#ff4d9a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing…
              </>
            ) : isFree ? (
              <>Register for Free</>
            ) : feeRupees != null ? (
              <>
                Register & Pay ₹{feeRupees}
                {appliedCoupon && baseFeeRupees != null && baseFeeRupees !== feeRupees ? (
                  <span className="text-white/60 text-xs font-medium line-through ml-1">
                    ₹{baseFeeRupees}
                  </span>
                ) : null}
              </>
            ) : (
              <>Register</>
            )}
          </button>
        )}
      </div>

      {couponModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#FF2D87]/35 bg-[#0a0a0a] p-5 sm:p-6 shadow-xl shadow-[#FF2D87]/10">
            <h3
              id="coupon-modal-title"
              className="font-heading text-white uppercase tracking-wide text-xl mb-2"
            >
              Have a coupon code?
            </h3>
            <p className="text-sm text-white/55 mb-4 leading-relaxed">
              Enter your code to unlock a discount on this phase.
            </p>
            <label className={labelClass} htmlFor="couponCodeInput">
              Coupon code
            </label>
            <input
              id="couponCodeInput"
              className={fieldClass}

              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void applyCouponCode();
                }
              }}
              autoFocus
              disabled={couponApplying}
            />
            {couponError && <p className={errorClass}>{couponError}</p>}
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={couponApplying}
                onClick={() => {
                  setCouponModalOpen(false);
                  setCouponError('');
                }}
                className="w-full sm:flex-1 min-h-11 inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 hover:border-white/40 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={couponApplying}
                onClick={() => void applyCouponCode()}
                className="w-full sm:flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors disabled:opacity-60"
              >
                {couponApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

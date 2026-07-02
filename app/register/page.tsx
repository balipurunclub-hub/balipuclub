'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  age: z.number().min(5, 'Age must be at least 5').max(100, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Prefer not to say'], { message: 'Please select a gender' }),
  city: z.string().min(2, 'City is required').max(100),
  emergencyContact: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  idProofType: z.string().min(1, 'Please select an ID proof type'),
  idProofNumber: z.string().min(4, 'Enter a valid ID proof number').max(30),
  source: z.string().min(1, 'Please select where you heard about us'),
  jerseySize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], { message: 'Please select a jersey size' }),
  declarationAgreed: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the declaration',
  }),
});

type FormData = z.infer<typeof schema>;

const GENDERS = ['Male', 'Female', 'Prefer not to say'];
const ID_PROOFS = ['Aadhar Card', 'Driving License', 'Voter ID', 'Passport', 'Other'];
const SOURCES = ['Social Media', 'Friends/Family', 'Advertisement', 'Running Club', 'Other'];
const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function RegistrationFormInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [checking, setChecking] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || '',
      name: user?.displayName || '',
    },
  });

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) setValue('email', user.email);
    if (user?.displayName) setValue('name', user.displayName);
  }, [user, setValue]);

  // Check if already registered
  useEffect(() => {
    if (!user) return;
    const checkReg = async () => {
      try {
        const snap = await getDoc(doc(db, 'registrations', user.uid));
        if (snap.exists()) setAlreadyRegistered(true);
      } finally {
        setChecking(false);
      }
    };
    checkReg();
  }, [user]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitError('');
    try {
      const regRef = doc(db, 'registrations', user.uid);
      await setDoc(regRef, {
        uid: user.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        city: data.city,
        emergencyContact: data.emergencyContact,
        idProofType: data.idProofType,
        idProofNumber: data.idProofNumber,
        source: data.source,
        jerseySize: data.jerseySize,
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push('/payment');
    } catch (err) {
      console.error(err);
      setSubmitError('Failed to save registration. Please try again.');
    }
  };

  if (checking) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="h-12 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="h-12 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
        <div className="h-24 bg-slate-200 rounded" />
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1B1B4D] mb-2">Already Registered!</h2>
        <p className="text-slate-600 mb-6">
          You have already submitted your registration details.
        </p>
        <button type="button" onClick={() => router.push('/payment')} className="btn-primary">
          Proceed to Payment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {submitError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-name" className="form-label">Full Name *</label>
          <input
            id="reg-name"
            type="text"
            placeholder="Priya Sharma"
            className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            {...register('name')}
          />
          {errors.name && <p className="error-msg">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="reg-email" className="form-label">Email *</label>
          <input
            id="reg-email"
            type="email"
            readOnly
            className="form-input opacity-60 cursor-not-allowed"
            {...register('email')}
          />
          <p className="text-xs text-slate-600 mt-1">From your account</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-phone" className="form-label">Mobile Number *</label>
          <input
            id="reg-phone"
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
            {...register('phone')}
          />
          {errors.phone && <p className="error-msg">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="reg-age" className="form-label">Age *</label>
          <input
            id="reg-age"
            type="number"
            placeholder="25"
            className={`form-input ${errors.age ? 'form-input-error' : ''}`}
            {...register('age', { valueAsNumber: true })}
          />
          {errors.age && <p className="error-msg">{errors.age.message}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-gender" className="form-label">Gender *</label>
          <select
            id="reg-gender"
            className={`form-input ${errors.gender ? 'form-input-error' : ''}`}
            {...register('gender')}
            defaultValue=""
          >
            <option value="" disabled>Select gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.gender && <p className="error-msg">{errors.gender.message}</p>}
        </div>

        <div>
          <label htmlFor="reg-city" className="form-label">City *</label>
          <input
            id="reg-city"
            type="text"
            placeholder="Mangalore"
            className={`form-input ${errors.city ? 'form-input-error' : ''}`}
            {...register('city')}
          />
          {errors.city && <p className="error-msg">{errors.city.message}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-emergencyContact" className="form-label">Emergency Contact (Phone) *</label>
          <input
            id="reg-emergencyContact"
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            className={`form-input ${errors.emergencyContact ? 'form-input-error' : ''}`}
            {...register('emergencyContact')}
          />
          {errors.emergencyContact && <p className="error-msg">{errors.emergencyContact.message}</p>}
        </div>

        <div>
          <label htmlFor="reg-jerseySize" className="form-label">Jersey Size *</label>
          <select
            id="reg-jerseySize"
            className={`form-input ${errors.jerseySize ? 'form-input-error' : ''}`}
            {...register('jerseySize')}
            defaultValue=""
          >
            <option value="" disabled>Select a size</option>
            {JERSEY_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.jerseySize && <p className="error-msg">{errors.jerseySize.message}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="reg-idProofType" className="form-label">ID Proof Type *</label>
          <select
            id="reg-idProofType"
            className={`form-input ${errors.idProofType ? 'form-input-error' : ''}`}
            {...register('idProofType')}
            defaultValue=""
          >
            <option value="" disabled>Select ID type</option>
            {ID_PROOFS.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          {errors.idProofType && <p className="error-msg">{errors.idProofType.message}</p>}
        </div>

        <div>
          <label htmlFor="reg-idProofNumber" className="form-label">ID Proof Number *</label>
          <input
            id="reg-idProofNumber"
            type="text"
            placeholder="1234 5678 9012"
            className={`form-input ${errors.idProofNumber ? 'form-input-error' : ''}`}
            {...register('idProofNumber')}
          />
          {errors.idProofNumber && <p className="error-msg">{errors.idProofNumber.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="reg-source" className="form-label">Where did you hear about us? *</label>
        <select
          id="reg-source"
          className={`form-input ${errors.source ? 'form-input-error' : ''}`}
          {...register('source')}
          defaultValue=""
        >
          <option value="" disabled>Select an option</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.source && <p className="error-msg">{errors.source.message}</p>}
      </div>

      <div className="flex items-start gap-3 pt-4">
        <input
          id="reg-declarationAgreed"
          type="checkbox"
          className={`mt-1 h-5 w-5 rounded border-slate-300 bg-white text-[#F5841F] focus:ring-[#F5841F] ${errors.declarationAgreed ? 'border-red-500' : ''}`}
          {...register('declarationAgreed')}
        />
        <div className="flex-1">
          <label htmlFor="reg-declarationAgreed" className="text-sm text-slate-700">
            I agree to the terms and conditions. I declare that I am physically fit to participate in this event and will not hold the organizers responsible for any injury or loss.
          </label>
          {errors.declarationAgreed && <p className="error-msg mt-1">{errors.declarationAgreed.message}</p>}
        </div>
      </div>

      <div className="pt-6">
        <button
          id="btn-reg-submit"
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? <div className="spinner" /> : 'Save & Continue to Payment'}
        </button>
      </div>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#F5841F]/10 blur-[120px]" />
        </div>

        <div className="w-full max-w-2xl animate-fade-in relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F5841F]/20 border border-[#F5841F]/30 mb-4">
              <ClipboardList className="w-7 h-7 text-[#F5841F]" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">Register for the Run</h1>
            <p className="text-slate-500">Secure your spot for the Balipu x Nexus event</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-1.5 rounded-full bg-[#F5841F]" />
            <div className="flex-1 h-1.5 rounded-full bg-slate-200" />
          </div>

          <div className="bg-white/95 backdrop-blur-xl border border-slate-100/80 rounded-3xl p-6 sm:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-[#F5841F]/10 to-transparent rounded-full blur-3xl -z-10"></div>
            <RegistrationFormInner />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

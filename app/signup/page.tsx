'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Ticket, Eye, EyeOff, AlertCircle } from 'lucide-react';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setAuthError('');
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await updateProfile(credential.user, { displayName: data.name });
      router.push('/register');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please log in.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password is too weak. Use at least 6 characters.');
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
    }
  };

  const handleGoogle = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/register');
    } catch (err: unknown) {
      const errorObj = err as any;
      console.error(errorObj);
      
      const errorCode = errorObj.code;
      
      if (errorCode === 'auth/popup-blocked') {
        // Fallback for strict mobile browsers that block popups
        signInWithRedirect(auth, new GoogleAuthProvider());
      } else if (
        errorCode === 'auth/web-storage-unsupported' || 
        errorCode === 'auth/third-party-auth-error' ||
        errorCode === 'auth/network-request-failed'
      ) {
        setAuthError('Google sign-in was blocked by your browser or an extension (like Brave Shields or AdBlocker). Please disable it for this site, or use Email/Password.');
        setGoogleLoading(false);
      } else if (errorCode !== 'auth/popup-closed-by-user') {
        setAuthError(`Google sign-in failed: ${errorObj.message || errorCode}. You may need to disable ad-blockers.`);
        setGoogleLoading(false);
      } else {
        // Popup closed by user, just stop loading
        setGoogleLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12 relative">
      {/* Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
            <Ticket className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B1B4D] mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm">Sign up to register for the Balipu Run</p>
        </div>

        <div className="card p-8">
          {/* Google */}
          <button
            id="btn-google-signup"
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2.5 rounded-xl transition-all mb-5 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="spinner" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {authError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signup-name" className="form-label">Full Name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Priya Sharma"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="error-msg">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="signup-email" className="form-label">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className="form-label">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
              <input
                id="signup-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="error-msg">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              id="btn-signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? <div className="spinner" /> : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-600 hover:text-violet-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok && !cancelled) {
          router.replace(next);
          return;
        }
      } catch {
        /* stay on login */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#FF2D87] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4 relative overflow-x-clip">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,45,135,0.14),_transparent_55%)]"
        aria-hidden
      />

      <div className="relative max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-[#FF2D87] text-[0.65rem] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Balipu Run Club
          </p>
          <h1 className="font-heading text-white uppercase tracking-wide text-[clamp(1.75rem,5vw,2.5rem)]">
            Admin Login
          </h1>
          <div className="w-14 h-1 bg-[#FF2D87] mx-auto mt-4" />
          <p className="text-white/50 text-sm mt-3">Sign in to manage registrations and scanners.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-3xl p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
              Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input
                type="email"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="balipurunclub@gmail.com"
                className="w-full min-h-11 rounded-full bg-black/50 border border-white/15 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full min-h-11 rounded-full bg-black/50 border border-white/15 pl-10 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

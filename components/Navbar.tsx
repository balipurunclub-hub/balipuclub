'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, Timer } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@techfest.com';
  const isAdmin = user?.email === adminEmail;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
      <nav className="w-full max-w-5xl pointer-events-auto relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

        {/* Top racing stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#F5841F] via-white/60 to-[#F5841F]" />

        {/* Dark warm gradient background */}
        <div className="absolute inset-0 bg-linear-to-r from-[#0D0D2B]/95 via-[#1a0800]/90 to-[#0D0D2B]/95 backdrop-blur-xl" />


        <div className="relative px-5 sm:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo + Run Club label */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 relative rounded-full overflow-hidden border-2 border-[#F5841F]/60 shadow-[0_0_12px_rgba(245,132,31,0.4)] group-hover:shadow-[0_0_20px_rgba(245,132,31,0.6)] transition-all duration-300">
                <Image src="/IMG_3702.PNG" alt="Balipu Logo" fill className="object-cover" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-heading text-lg sm:text-xl tracking-widest text-white group-hover:text-[#F5841F] transition-colors uppercase">BALIPU</span>
                <span className="text-[9px] tracking-[0.25em] text-[#F5841F]/80 uppercase font-semibold -mt-0.5">Run Club</span>
              </div>
            </Link>

            {/* Center event badge */}
            <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              <Timer className="w-4 h-4 text-[#F5841F]" />
              <span className="text-xs font-bold tracking-[0.15em] text-white/60 uppercase">12 July 2026 · 6:30 AM</span>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-4">
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-4">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className={`text-sm font-semibold tracking-wide transition-colors ${
                            pathname === '/admin' ? 'text-[#F5841F]' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Admin
                        </Link>
                      )}
                      {pathname !== '/dashboard' && (
                        <Link
                          href="/dashboard"
                          className="text-sm font-semibold tracking-wide text-slate-300 hover:text-white transition-colors"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors ml-2 pl-3 border-l border-white/10"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Link
                        href="/login"
                        className="text-sm font-semibold text-slate-300 hover:text-white transition-colors tracking-wide"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="btn-primary text-sm py-2 px-5 shadow-lg shadow-[#F5841F]/20 hover:shadow-[#F5841F]/40"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom track line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#F5841F]/40 to-transparent" />
      </nav>
    </div>
  );
}

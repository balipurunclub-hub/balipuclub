'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, User as UserIcon } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-[#0B0B2A]/90 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full overflow-hidden flex items-center justify-center border border-white/20 shadow-md group-hover:border-[#F5841F]/50 transition-colors">
              <Image src="/IMG_3702.PNG" alt="Balipu Logo" fill className="object-cover" />
            </div>
            <span className="font-heading text-xl sm:text-2xl tracking-widest text-white group-hover:text-[#F5841F] transition-colors">BALIPU</span>
          </Link>

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
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors ml-4 pl-4 border-l border-white/10"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/login"
                      className="text-sm font-semibold text-slate-300 hover:text-white transition-colors tracking-wide"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary text-sm py-2 px-6 shadow-lg shadow-[#F5841F]/20 hover:shadow-[#F5841F]/40"
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
    </nav>
  );
}

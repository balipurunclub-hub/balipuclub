'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:border-[#FF2D87]/40 hover:text-white transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Log out
    </button>
  );
}

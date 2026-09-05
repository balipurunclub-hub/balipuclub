'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function AdminRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
          return;
        }
        if (!cancelled) setOk(true);
      } catch {
        router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ok) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#FF2D87] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

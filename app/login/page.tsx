import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RefreshCw } from 'lucide-react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Admin Login',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[#FF2D87] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

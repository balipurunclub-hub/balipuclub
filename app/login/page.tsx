import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import LoginForm from './LoginForm';

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

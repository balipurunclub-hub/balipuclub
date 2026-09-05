import type { Metadata } from 'next';
import Link from 'next/link';
import { AloysiusRegistrationForm } from '@/components/events/AloysiusRegistrationForm';

export const metadata: Metadata = {
  title: 'Register | Balipu x Aloysius',
  description:
    'Register for Balipu x Aloysius: Mangalore’s first ever super car run. 11th October 2026.',
};

export default function AloysiusRegisterPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 lg:pt-28 pb-16 sm:pb-20 overflow-x-clip">
      <div className="site-container max-w-3xl w-full min-w-0">
        <Link
          href="/events/balipu-x-aloysius"
          className="text-sm text-white/50 hover:text-[#FF2D87] transition-colors"
        >
          ← Back to event
        </Link>

        <div className="mt-8 mb-10 min-w-0 break-words">
          <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4">
            Registration
          </p>
          <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.95] text-[clamp(2rem,5vw,3.25rem)] mb-3 break-words">
            Balipu x Aloysius
          </h1>
          <div className="w-20 h-1 bg-[#FF2D87] mb-5" />
          <p className="text-white/65 text-base sm:text-lg">
            Mangalore&apos;s first ever super car run. 11th October 2026. Assembly at 6:15 AM,
            event starts at 6:30 AM. Fill in your details to secure your spot.
          </p>
        </div>

        <div className="rounded-2xl border border-[#FF2D87]/25 bg-[#0a0a0a] p-4 sm:p-6 lg:p-10 w-full min-w-0">
          <AloysiusRegistrationForm />
        </div>
      </div>
    </div>
  );
}

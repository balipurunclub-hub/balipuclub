import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gallery | Coming Soon',
  description:
    'The Balipu Run Club gallery is coming soon. Stories from the streets of Mangaluru are on the way.',
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-clip flex flex-col">
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-xl h-[50%] rounded-full bg-[#FF2D87]/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center site-container pt-28 pb-20 text-center min-w-0">
        <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.25em] sm:tracking-[0.4em] uppercase mb-6 animate-fade-in-up">
          Gallery
        </p>

        <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.92] text-[clamp(3rem,10vw,6.5rem)] mb-4 break-words animate-fade-in-up delay-100">
          Coming Soon
        </h1>

        <div className="w-20 h-1 bg-[#FF2D87] mx-auto mb-8 animate-fade-in-up delay-100" />

        <p className="font-heading text-white uppercase tracking-wide text-[clamp(1.25rem,3vw,2rem)] mb-6 break-words animate-fade-in-up delay-200">
          Same Streets. Bigger Stories.
        </p>

        <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-4 animate-fade-in-up delay-200">
          We&apos;re gathering the finishes, the high-fives, and the early-morning light from every
          Balipu run.
        </p>

        <p className="text-white/50 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-12 animate-fade-in-up delay-300">
          Until then, follow the journey live. The gallery drops soon.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto animate-fade-in-up delay-300">
          <a
            href="https://www.instagram.com/balipurunclub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#FF2D87] px-7 py-3.5 min-h-11 w-full sm:w-auto text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
          >
            Follow on Instagram
          </a>
          <Link
            href="/#home"
            className="inline-flex items-center justify-center rounded-full border border-[#FF2D87] px-7 py-3.5 min-h-11 w-full sm:w-auto text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

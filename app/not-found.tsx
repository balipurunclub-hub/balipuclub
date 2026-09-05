import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-clip flex flex-col">
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-xl h-[50%] rounded-full bg-[#FF2D87]/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center site-container pt-28 pb-20 text-center min-w-0">
        <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.25em] sm:tracking-[0.4em] uppercase mb-6">
          Error
        </p>

        <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.85] text-[clamp(5rem,18vw,10rem)] mb-2 break-words">
          404
        </h1>

        <h2 className="font-heading text-white uppercase tracking-wide text-[clamp(1.5rem,4vw,2.5rem)] mb-6 break-words">
          Page Not Found
        </h2>

        <div className="w-20 h-1 bg-[#FF2D87] mx-auto mb-8" />

        <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-4">
          Looks like this route took a wrong turn. The page you&apos;re looking for doesn&apos;t
          exist or has moved.
        </p>

        <p className="text-white/45 text-sm sm:text-base max-w-sm mx-auto mb-12">
          Lace up and head back to the start line.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#FF2D87] px-7 py-3.5 min-h-11 w-full sm:w-auto text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/#upcoming-events"
            className="inline-flex items-center justify-center rounded-full border border-[#FF2D87] px-7 py-3.5 min-h-11 w-full sm:w-auto text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
          >
            View Events
          </Link>
        </div>
      </div>
    </div>
  );
}

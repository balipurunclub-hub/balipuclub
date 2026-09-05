import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

type AdminShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: 'full' | '4xl' | '2xl';
};

export function AdminShell({
  eyebrow = 'Balipu Run Club',
  title,
  description,
  backHref,
  actions,
  children,
  maxWidth = 'full',
}: AdminShellProps) {
  const widthClass =
    maxWidth === '2xl' ? 'max-w-2xl' : maxWidth === '4xl' ? 'max-w-4xl' : '';

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 relative overflow-x-clip">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,45,135,0.12),_transparent_55%)]"
        aria-hidden
      />
      <div className={`relative site-container animate-fade-in min-w-0 ${widthClass} ${widthClass ? 'mx-auto' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-white/10 min-w-0">
          <div className="min-w-0 flex items-start gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-[#FF2D87]/50 hover:bg-[#FF2D87]/10 transition-colors shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="min-w-0">
              <p className="text-[#FF2D87] text-[0.65rem] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-2">
                {eyebrow}
              </p>
              <h1 className="font-heading text-white uppercase leading-[0.95] text-[clamp(1.75rem,4vw,2.75rem)] tracking-wide break-words">
                {title}
              </h1>
              {description && (
                <p className="text-white/55 text-sm mt-2 max-w-xl break-words">{description}</p>
              )}
              <div className="w-14 h-1 bg-[#FF2D87] mt-4" />
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs: { name: string; href?: string }[];
  children: ReactNode;
};

export function SeoPageShell({ eyebrow, title, description, crumbs, children }: Props) {
  return (
    <div className="min-h-screen bg-black text-white pt-24 lg:pt-28 pb-16 sm:pb-20 overflow-x-clip">
      <div className="site-container max-w-4xl w-full min-w-0">
        <Breadcrumbs items={crumbs} />
        {eyebrow && (
          <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.95] text-[clamp(2rem,5vw,3.5rem)] mb-4 break-words">
          {title}
        </h1>
        <div className="w-16 sm:w-20 h-1 bg-[#FF2D87] mb-6" />
        {description && (
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl mb-10">
            {description}
          </p>
        )}
        <div className="prose-invert max-w-none space-y-8 text-white/75 text-sm sm:text-base leading-relaxed">
          {children}
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/runs" className="text-[#FF2D87] hover:underline">
            Upcoming runs
          </Link>
          <Link href="/events" className="text-[#FF2D87] hover:underline">
            Events
          </Link>
          <Link href="/join" className="text-[#FF2D87] hover:underline">
            Join Balipu
          </Link>
          <Link href="/faq" className="text-[#FF2D87] hover:underline">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

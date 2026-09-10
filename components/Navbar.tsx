'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { WHATSAPP_JOIN } from '@/lib/seo';

const navLinks: { href: string; label: string; badge?: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/#upcoming-events', label: 'Events' },
  { href: '/events/balipu-x-aloysius', label: 'Balipu × Aloysius', badge: 'NEW' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (active: boolean) =>
    `relative inline-flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors whitespace-nowrap ${
      active ? 'text-white' : 'text-white/80 hover:text-[#FF2D87]'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <nav className="site-container" aria-label="Primary">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-3 min-w-0">
          <Link href="/" className="relative z-10 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 relative rounded-full overflow-hidden ring-2 ring-[#FF2D87]/50">
              <Image
                src="/IMG_3702.PNG"
                alt="Balipu Run Club logo — Mangaluru running community"
                fill
                className="object-cover"
                priority
              />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-4 xl:gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(isActive(link.href))}>
                {link.label}
                {link.badge && (
                  <span className="rounded-sm bg-[#FF2D87] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white leading-none">
                    {link.badge}
                  </span>
                )}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#FF2D87] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0 ml-auto">
            <Link
              href="/join"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#FF2D87] px-4 xl:px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors whitespace-nowrap"
            >
              Join Balipu
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center text-white ml-auto"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <div className="site-container py-4 sm:py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-3.5 min-h-11 text-base font-medium transition-colors inline-flex items-center gap-2 ${
                  isActive(link.href) ? 'text-[#FF2D87]' : 'text-white/90 hover:text-[#FF2D87]'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="rounded-sm bg-[#FF2D87] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/join"
              onClick={() => setMobileOpen(false)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-5 py-3 text-sm font-semibold text-white"
            >
              Join Balipu Run Club
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={WHATSAPP_JOIN}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80"
            >
              WhatsApp community
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

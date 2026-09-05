'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

const WHATSAPP_JOIN = 'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc';

const scrollLinks = [
  { hash: '#home', label: 'Home' },
  { hash: '#about', label: 'About' },
  { hash: '#upcoming-events', label: 'Events' },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hash, setHash] = useState('#home');

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || '#home');
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [pathname]);

  const scrollHref = (linkHash: string) => (pathname === '/' ? linkHash : `/${linkHash}`);

  const isScrollActive = (linkHash: string) => pathname === '/' && hash === linkHash;

  const linkClass = (active: boolean) =>
    `relative text-sm font-medium tracking-wide transition-colors ${
      active ? 'text-white' : 'text-white/80 hover:text-[#FF2D87]'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <nav className="site-container">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-3 min-w-0">
          <a href={scrollHref('#home')} className="relative z-10 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 relative rounded-full overflow-hidden ring-2 ring-[#FF2D87]/50">
              <Image src="/IMG_3702.PNG" alt="Balipu Run Club" fill className="object-cover" />
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-4 xl:gap-7 absolute left-1/2 -translate-x-1/2">
            {scrollLinks.map((link) => (
              <a
                key={link.label}
                href={scrollHref(link.hash)}
                onClick={() => setHash(link.hash)}
                className={linkClass(isScrollActive(link.hash))}
              >
                {link.label}
                {isScrollActive(link.hash) && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#FF2D87] rounded-full" />
                )}
              </a>
            ))}
            <Link
              href="/events/balipu-x-aloysius"
              className={`${linkClass(pathname.startsWith('/events/balipu-x-aloysius'))} pt-2`}
            >
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-[#FF2D87] px-1.5 py-px text-[8px] font-bold leading-none tracking-wider text-white uppercase">
                New
              </span>
              Balipu × Aloysius
              {pathname.startsWith('/events/balipu-x-aloysius') && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#FF2D87] rounded-full" />
              )}
            </Link>
            <Link href="/gallery" className={linkClass(pathname === '/gallery')}>
              Gallery
              {pathname === '/gallery' && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#FF2D87] rounded-full" />
              )}
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
            <a
              href={WHATSAPP_JOIN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#FF2D87] px-4 xl:px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors whitespace-nowrap"
            >
              Join the Run Club
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>
          </div>

          <button
            type="button"
            className="lg:hidden relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center text-white"
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
            {scrollLinks.map((link) => (
              <a
                key={link.label}
                href={scrollHref(link.hash)}
                onClick={() => {
                  setHash(link.hash);
                  setMobileOpen(false);
                }}
                className="px-3 py-3.5 min-h-11 text-base font-medium text-white/90 hover:text-[#FF2D87] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/events/balipu-x-aloysius"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-3 min-h-11 flex flex-col items-start justify-center gap-1 text-base font-medium transition-colors ${
                pathname.startsWith('/events/balipu-x-aloysius')
                  ? 'text-[#FF2D87]'
                  : 'text-white/90 hover:text-[#FF2D87]'
              }`}
            >
              <span className="rounded-full bg-[#FF2D87] px-1.5 py-px text-[8px] font-bold leading-none tracking-wider text-white uppercase">
                New
              </span>
              Balipu × Aloysius
            </Link>
            <Link
              href="/gallery"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-3.5 min-h-11 text-base font-medium transition-colors ${
                pathname === '/gallery' ? 'text-[#FF2D87]' : 'text-white/90 hover:text-[#FF2D87]'
              }`}
            >
              Gallery
            </Link>
            <a
              href={WHATSAPP_JOIN}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-5 py-3 text-sm font-semibold text-white"
            >
              Join the Run Club
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

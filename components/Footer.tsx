'use client';

import Link from 'next/link';
import Image from 'next/image';
import { INSTAGRAM, WHATSAPP_JOIN } from '@/lib/seo';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#about', label: 'About' },
  { href: '/runs', label: 'Upcoming Runs' },
  { href: '/events', label: 'Events' },
  { href: '/community', label: 'Community' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/join', label: 'Join' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
];

export function Footer() {
  return (
    <footer className="bg-black text-white relative overflow-x-clip pt-10 sm:pt-14 pb-6 sm:pb-8 border-t border-white/10">
      <div className="absolute left-0 top-0 w-[35%] h-[60%] rounded-full bg-[#FF2D87]/10 blur-[100px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-[30%] h-[50%] rounded-full bg-[#FF2D87]/8 blur-[90px] pointer-events-none" />

      <div className="site-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative rounded-full overflow-hidden ring-2 ring-[#FF2D87]/40 shrink-0">
                <Image
                  src="/IMG_3702.PNG"
                  alt="Balipu Run Club logo"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="font-heading text-2xl tracking-wide text-white uppercase">
                Balipu
              </span>
            </div>
            <p className="text-[#FF2D87] text-sm font-medium">Run for a Bigger Tomorrow</p>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Balipu Run Club is a running community in Mangaluru (Mangalore), Karnataka — community
              runs, events and belonging.
            </p>
          </div>

          <div className="space-y-4 min-w-0">
            <h2 className="text-[#FF2D87] text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase">
              Explore
            </h2>
            <ul className="space-y-2.5 text-white/65 text-sm columns-2 gap-x-6">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href} className="break-inside-avoid">
                  <Link href={link.href} className="hover:text-[#FF2D87] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 min-w-0">
            <h2 className="text-[#FF2D87] text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase">
              Contact
            </h2>
            <ul className="space-y-2.5 text-white/65 text-sm">
              <li>
                <a
                  href="mailto:Balipurunclub@gmail.com"
                  className="hover:text-[#FF2D87] transition-colors break-all sm:break-words"
                >
                  Balipurunclub@gmail.com
                </a>
              </li>
              <li className="break-words flex flex-col sm:block gap-0.5">
                <a href="tel:+918317380741" className="hover:text-[#FF2D87]">
                  +91 8317380741
                </a>
                <span className="hidden sm:inline"> | </span>
                <a href="tel:+917349791297" className="hover:text-[#FF2D87]">
                  +91 7349791297
                </a>
              </li>
              <li className="text-white/45 break-words">Mangaluru, Karnataka, India</li>
              <li className="text-white/45 break-words">Founders: Jeethesh A &amp; Sohan Raj</li>
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 min-h-11 text-sm text-white/70 hover:border-[#FF2D87]/40 hover:text-[#FF2D87] transition-colors"
              >
                Instagram
              </a>
              <a
                href={WHATSAPP_JOIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 min-h-11 text-sm text-white/70 hover:border-[#FF2D87]/40 hover:text-[#FF2D87] transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/35">
          <p>© {new Date().getFullYear()} Balipu Run Club. Mangaluru, Karnataka.</p>
          <p>
            <a href="https://balipuclub.in" className="hover:text-[#FF2D87]">
              balipuclub.in
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

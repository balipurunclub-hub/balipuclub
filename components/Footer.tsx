'use client';

import Link from 'next/link';
import Image from 'next/image';

const WHATSAPP_JOIN = 'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc';
const INSTAGRAM = 'https://www.instagram.com/balipurunclub';

export function Footer() {
  return (
    <footer className="bg-black text-white relative overflow-x-clip pt-10 sm:pt-14 pb-6 sm:pb-8 border-t border-white/10">
      <div className="absolute left-0 top-0 w-[35%] h-[60%] rounded-full bg-[#FF2D87]/10 blur-[100px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-[30%] h-[50%] rounded-full bg-[#FF2D87]/8 blur-[90px] pointer-events-none" />

      <div className="site-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative rounded-full overflow-hidden ring-2 ring-[#FF2D87]/40 shrink-0">
                <Image
                  src="/IMG_3702.PNG"
                  alt="Balipu Logo"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="font-heading text-2xl tracking-wide text-white uppercase">
                Balipu
              </span>
            </div>
            <p className="text-[#FF2D87] text-sm font-medium">
              Run for a Bigger Tomorrow
            </p>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Mangaluru&apos;s running community: events, movement, and belonging.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-[#FF2D87] text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-white/65 text-sm">
              <li>
                <Link href="/#home" className="hover:text-[#FF2D87] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#FF2D87] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#upcoming-events" className="hover:text-[#FF2D87] transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#FF2D87] transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="/events/balipu-x-aloysius/register"
                  className="hover:text-[#FF2D87] transition-colors"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-[#FF2D87] text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase">
              Contact
            </h4>
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
                <span>+91 8317380741</span>
                <span className="hidden sm:inline"> | </span>
                <span>+91 7349791297</span>
              </li>
              <li className="text-white/45 break-words">Founders: Jeethesh A &amp; Sohan Raj</li>
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 min-h-11 text-sm text-white/70 hover:border-[#FF2D87]/40 hover:text-[#FF2D87] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                Instagram
              </a>
              <a
                href={WHATSAPP_JOIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 min-h-11 text-sm text-white/70 hover:border-[#FF2D87]/40 hover:text-[#FF2D87] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/40 text-center sm:text-left">
          <p className="break-words">&copy; {new Date().getFullYear()} Balipu Run Club. All rights reserved.</p>
          <p className="text-[#FF2D87]/70 text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-medium">
            Run Belong Repeat
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[#FF2D87] to-transparent" />
    </footer>
  );
}

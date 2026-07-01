'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-[#1B1B4D] text-white relative overflow-hidden pt-12 pb-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative rounded-full overflow-hidden flex items-center justify-center shrink-0">
                <Image src="/IMG_3702.PNG" alt="Balipu Logo" width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <span className="font-heading text-2xl tracking-wide text-white">BALIPU</span>
            </div>
            <p className="text-[#F5841F] font-semibold italic">
              Stronger Together, Healthier Tomorrow!
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Quick Links</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <Link href="/" className="hover:text-[#F5841F] transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#F5841F] transition-colors">Register for Run</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#F5841F] transition-colors">My Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Contact Us</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>Email: Balipurunclub@gmail.com</li>
              <li>Phone: +91 8317380741, +91 7349791297</li>
              <li>Venue: Fiza by Nexus Mall, Mangaluru</li>
              <li>Co-founders: Jeethesh A & Sohan Raj</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Balipu Run Club. All rights reserved.</p>
        </div>
      </div>
      
      {/* Decorative strip at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-linear-to-r from-[#6B2FA0] via-[#F5841F] to-[#6B2FA0]" />
    </footer>
  );
}

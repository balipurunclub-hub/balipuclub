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
                <Link href="/#upcoming-events" className="hover:text-[#F5841F] transition-colors">Upcoming Events</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#F5841F] transition-colors">Member Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Contact Us</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>Email: Balipurunclub@gmail.com</li>
              <li>Phone: +91 8317380741, +91 7349791297</li>
              <li>Co-founders: Jeethesh A & Sohan Raj</li>
            </ul>
            
            <div className="flex items-center gap-5 pt-4">
              <a href="https://www.instagram.com/balipurunclub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-[#f9ce34] transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </div>
                <span className="text-sm font-medium">Instagram</span>
              </a>
              <a href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-[#25D366] transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
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

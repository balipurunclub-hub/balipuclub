'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowDown } from 'lucide-react';

export default function Home() {
  const scrollToEvents = () => {
    const element = document.getElementById('upcoming-events');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* HERO SECTION - PURELY CLUB FOCUSED */}
      <section className="relative w-full pt-32 pb-32 lg:pt-44 lg:pb-40 overflow-hidden bg-linear-to-br from-[#1B1B4D] via-[#2D1B36] to-[#F5841F]/30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#6B2FA0]/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-0 w-120 h-120 bg-[#F5841F]/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.15] mix-blend-overlay"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6 animate-fade-in-up">
              <div className="w-24 h-24 sm:w-32 sm:h-32 relative rounded-full overflow-hidden flex items-center justify-center shadow-xl shadow-[#6B2FA0]/20 border-4 border-white/50">
                <Image src="/IMG_3702.PNG" alt="Balipu Logo" fill className="object-cover" priority />
              </div>
            </div>

            {/* Hero Title */}
            <div className="relative font-heading uppercase italic tracking-tighter mb-8 mt-6 -skew-x-3 text-center mx-auto px-4 animate-fade-in-up delay-100">
              <div className="text-[#F5841F] drop-shadow-[0_4px_24px_rgba(245,132,31,0.6)] text-[clamp(3.5rem,15vw,8rem)] leading-[0.85]">
                BALIPU
              </div>
              <div className="text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] text-[clamp(3.5rem,15vw,8rem)] leading-[0.85] sm:-translate-x-6 mt-2">
                RUN CLUB
              </div>
            </div>

            <p className="text-xl sm:text-2xl text-white font-medium mb-2 drop-shadow-md animate-fade-in-up delay-200">
              Mangaluru's premier community of runners & fitness enthusiasts.
            </p>
            <p className="text-lg sm:text-xl text-[#F5841F] italic font-semibold mb-12 drop-shadow-md animate-fade-in-up delay-200">
              "Run for a Better Tomorrow"
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-300">
              <a href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc" target="_blank" rel="noopener noreferrer" className="btn-primary uppercase text-sm sm:text-base px-6 py-4 shadow-xl hover:shadow-[#F5841F]/40 transform transition hover:scale-105 w-full sm:w-auto flex justify-center items-center gap-2">
                Join our WhatsApp
              </a>
              <a href="https://www.instagram.com/balipurunclub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-6 py-4 text-sm sm:text-base font-semibold text-white uppercase tracking-wide shadow-xl hover:shadow-[#ee2a7b]/40 transform transition hover:scale-105 w-full sm:w-auto gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Connect on Instagram
              </a>
              <button onClick={scrollToEvents} className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4 shadow-xl transform transition hover:scale-105 w-full sm:w-auto flex justify-center items-center gap-2">
                Upcoming Events
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT THE CLUB */}
      <section className="py-20 bg-white relative overflow-hidden border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center animate-fade-in">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">About Us</h2>
            <h2 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">
              More Than Just a Run
            </h2>
            <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-4 mb-8 rounded-full"></div>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-6">
              <strong className="text-[#1B1B4D]">Balipu Run Club</strong> is a growing community of fitness enthusiasts in Mangaluru. We are bringing together athletes, students, and professionals to build a stronger, brighter future through active lifestyles.
            </p>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              This isn't just a one-time event—our club is a permanent fixture in the city. We will be consistently organizing different kinds of runs, training sessions, and fitness activities to keep our community active, supported, and moving forward.
            </p>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS SECTION */}
      <section id="upcoming-events" className="py-24 bg-slate-50 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B2FA0] rounded-full blur-[100px] opacity-10"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6">Recent Events</h2>
            <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event Summary Card */}
            <Link href="/events/monsoon-run" className="block group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200 flex flex-col h-full grayscale-50 hover:grayscale-0 opacity-90 transition-all duration-300">
                <div className="w-full h-48 sm:h-56 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                    <span className="bg-black/60 text-white font-bold px-4 py-2 rounded-lg tracking-widest uppercase border border-white/20 backdrop-blur-sm">Completed</span>
                  </div>
                  <img src="/poster.png" alt="The Monsoon Run" className="w-full h-full object-cover object-top" />
                </div>
                
                <div className="p-8 flex flex-col flex-1 text-center">
                  <div className="inline-block bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-4 mx-auto border border-slate-200">
                    ✅ Event Concluded</div>
                  <h3 className="font-heading text-3xl text-slate-500 uppercase italic -skew-x-3 mb-2">
                    The Monsoon Run
                  </h3>
                  <p className="text-slate-400 font-medium mb-6">12th July 2026<br/>Fiza by nexus</p>
                </div>
              </div>
            </Link>

            {/* Event Summary Card - Dance Battle */}
            <Link href="/events/monsoon-dancebattle" className="block group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200 flex flex-col h-full grayscale-50 hover:grayscale-0 opacity-90 transition-all duration-300">
                <div className="w-full h-48 sm:h-56 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                    <span className="bg-black/60 text-white font-bold px-4 py-2 rounded-lg tracking-widest uppercase border border-white/20 backdrop-blur-sm">Completed</span>
                  </div>
                  <img src="/dancePoster.png" alt="Monsoon Dance Battle" className="w-full h-full object-cover object-top" />
                </div>
                
                <div className="p-8 flex flex-col flex-1 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                  <div className="inline-block bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-4 mx-auto border border-slate-200">
                    ✅ Event Concluded
                  </div>
                  <h3 className="font-heading text-3xl text-slate-500 uppercase italic -skew-x-3 mb-2 tracking-tight">
                    Monsoon Dance Battle
                  </h3>
                  <p className="text-slate-400 font-medium mb-6">12th July 2026<br/>Fiza by nexus</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CLUB LEADERSHIP */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center animate-fade-in">
            <h2 className="font-heading text-4xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">Club Leadership</h2>
            <div className="w-16 h-1 bg-[#F5841F] mx-auto mt-2 mb-10 rounded-full"></div>

            <div className="flex flex-col items-center">
              <div className="text-2xl font-heading text-[#1B1B4D] mb-1">Jeethesh A &amp; Sohan Raj</div>
              <span className="text-base font-sans font-medium text-[#F5841F]">Founders, Balipu Run Club</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

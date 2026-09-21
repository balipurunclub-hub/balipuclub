'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

type Sponsor = {
  name: string;
  role: string;
  image: string;
  alt: string;
};

const sponsors: Sponsor[] = [
  {
    name: 'Autonex',
    role: 'Automotive and media partner',
    image: '/Autonex.jpeg',
    alt: 'Autonex logo',
  },
  {
    name: 'Kasharp',
    role: 'Fitness partner',
    image: '/Kasharp.jpeg',
    alt: 'Kasharp logo',
  },
  {
    name: 'Decathlon',
    role: 'Sporting partner',
    image: '/full_decathlon.jpg',
    alt: 'Decathlon logo',
  },
  {
    name: 'Prasad Associates',
    role: 'Automotive partner',
    image: '/Prasad.PNG',
    alt: 'Prasad Associates logo',
  },
  {
    name: 'Punarva',
    role: 'Wellness partner',
    image: '/punarva.PNG',
    alt: 'Punarva logo',
  },
];

export function SponsorsSection() {
  const [mobileIndex, setMobileIndex] = useState(0);
  const duplicateSponsors = [...sponsors, ...sponsors];

  const goToNext = useCallback(() => {
    setMobileIndex((prev) => (prev + 1) % sponsors.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [goToNext]);

  const currentSponsor = sponsors[mobileIndex];

  return (
    <section className="py-[var(--section-pad-y)] bg-black border-t border-white/5 overflow-hidden">
      <div className="site-container mb-8 sm:mb-10 lg:mb-14">
        <p className="text-[#FF2D87] text-[0.65rem] sm:text-xs md:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4">
          Our Partners
        </p>
        <h2 className="font-heading text-[#FF2D87] uppercase leading-[0.95] text-[clamp(1.85rem,5vw,3.75rem)] break-words">
          Sponsors &amp; Supporters
        </h2>
        <div className="w-16 sm:w-20 h-1 bg-[#FF2D87] mt-5 sm:mt-6" />
        <p className="text-white/60 text-sm sm:text-base mt-4 max-w-xl">
          Balipu Run Club is powered by our amazing partners who make every run and event
          possible in Mangaluru.
        </p>
      </div>

      {/* Mobile — carousel with Next button and 3s auto-advance */}
      <div className="sm:hidden relative px-4">
        <div className="relative mx-auto max-w-xs">
          <div
            key={mobileIndex}
            className="flex flex-col items-center gap-3 animate-fade-in-up"
          >
            <div className="relative w-full h-28 rounded-2xl border border-[#FF2D87]/30 bg-white/5 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_0_40px_-10px_rgba(255,45,135,0.25)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSponsor.image}
                alt={currentSponsor.alt}
                className="max-w-[75%] max-h-[70%] object-contain"
              />
            </div>
            <div className="text-center min-w-0">
              <p className="font-heading text-white uppercase tracking-wide text-base">
                {currentSponsor.name}
              </p>
              <p className="text-white/50 text-xs font-medium tracking-[0.08em] uppercase mt-1">
                {currentSponsor.role}
              </p>
            </div>
          </div>

          <button
            onClick={goToNext}
            className="mt-5 mx-auto inline-flex items-center gap-2 rounded-full bg-[#FF2D87] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff4d9a] active:scale-[0.98] transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            {sponsors.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === mobileIndex
                    ? 'w-6 bg-[#FF2D87]'
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop & Tablet — infinite marquee with hover pause */}
      <div className="hidden sm:block relative group">
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div
          className="flex flex-nowrap gap-8 sm:gap-12 lg:gap-16 animate-marquee group-hover:[animation-play-state:paused]"
          style={{ width: 'max-content' }}
        >
          {duplicateSponsors.map((sponsor, idx) => (
            <div
              key={`${sponsor.name}-${idx}`}
              className="flex flex-col items-center gap-3 sm:gap-4 shrink-0 group/sponsor"
            >
              <div className="relative w-40 h-24 sm:w-56 sm:h-32 lg:w-64 lg:h-36 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center overflow-hidden hover:border-[#FF2D87]/40 hover:bg-white/10 transition-all duration-300 group-hover/sponsor:shadow-[0_0_40px_-10px_rgba(255,45,135,0.3)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sponsor.image}
                  alt={sponsor.alt}
                  className="max-w-[80%] max-h-[75%] object-contain transition-transform duration-300 group-hover/sponsor:scale-105"
                />
              </div>
              <div className="text-center min-w-0">
                <p className="font-heading text-white uppercase tracking-wide text-sm sm:text-base lg:text-lg break-words">
                  {sponsor.name}
                </p>
                <p className="text-white/50 text-[0.65rem] sm:text-xs font-medium tracking-[0.08em] uppercase mt-1 break-words">
                  {sponsor.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

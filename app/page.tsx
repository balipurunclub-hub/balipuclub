'use client';

import Link from 'next/link';
import { ArrowRight, Users, Calendar, MapPin, Heart, Clock } from 'lucide-react';
import { HeroVisual } from '@/components/HeroVisual';
import { ParallaxSection } from '@/components/ParallaxSection';

const WHATSAPP_JOIN = 'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc';

const stats = [
  { icon: Users, value: '500+', label: 'Runners' },
  { icon: Calendar, value: '50+', label: 'Events' },
  { icon: MapPin, value: '1', label: 'City' },
  { icon: Heart, value: 'A Stronger', label: 'Community' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* HERO — full-bleed visual, fluid copy */}
      <ParallaxSection
        id="home"
        intensity={70}
        glowSide="none"
        className="flex flex-col bg-black pt-16 lg:pt-20 min-h-dvh"
      >
        <div className="relative flex flex-col flex-1 w-full min-h-0">
          {/* Desktop / large: full-bleed runner on the right */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden lg:block left-[42%] xl:left-[40%] 2xl:left-[38%]"
            aria-hidden
          >
            <HeroVisual />
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden lg:block w-[48%] xl:w-[46%] bg-linear-to-r from-black via-black/85 to-transparent" />

          <div className="relative z-10 flex flex-col justify-center w-full site-container pt-10 sm:pt-14 lg:py-20 lg:min-h-[min(70dvh,720px)]">
            <div className="w-full max-w-xl xl:max-w-2xl min-w-0">
              <p className="text-[#FF2D87] text-[0.65rem] sm:text-xs md:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4 sm:mb-5 animate-fade-in-up">
                Balipu Run Club
              </p>

              <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.92] text-[clamp(2.25rem,8vw,5.5rem)] mb-5 sm:mb-6 break-words animate-fade-in-up delay-100">
                Run for a
                <br />
                Bigger Tomorrow
              </h1>

              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed max-w-md mb-8 sm:mb-10 animate-fade-in-up delay-200">
                More than just runs. We bring people together through movement,
                community and a shared love for the city. Run events. Meet new
                people. Explore your city.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-fade-in-up delay-300">
                <a
                  href={WHATSAPP_JOIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-6 sm:px-7 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
                >
                  Join the Run Club
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </a>
                <a
                  href="#upcoming-events"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#FF2D87] px-6 sm:px-7 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
                >
                  View Upcoming Events
                </a>
              </div>
            </div>
          </div>

          {/* Mobile / tablet: stacked visual under copy */}
          <div className="relative z-10 lg:hidden w-full mt-6 sm:mt-8 h-[min(52vw,320px)] sm:h-[360px] animate-fade-in-up delay-200">
            <HeroVisual />
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 bg-black/90 backdrop-blur-sm">
          <div className="site-container">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/10">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-6 sm:py-8 px-2 sm:px-4 text-center min-w-0"
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF2D87]" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <div className="text-[#FF2D87] font-heading text-xl sm:text-2xl md:text-3xl tracking-wide uppercase break-words">
                      {stat.value}
                    </div>
                    <div className="text-white/70 text-[0.65rem] sm:text-xs md:text-sm font-medium tracking-[0.12em] sm:tracking-[0.2em] uppercase mt-1 break-words">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 overflow-hidden bg-black py-10 sm:py-12 lg:py-16 border-t border-white/5">
          <svg
            className="absolute left-0 bottom-2 sm:bottom-4 w-[min(55%,28rem)] h-8 sm:h-10 md:h-14 text-[#FF2D87]"
            viewBox="0 0 400 48"
            fill="currentColor"
            aria-hidden
          >
            <path d="M0 28 C40 8, 80 40, 120 22 C160 4, 200 38, 250 20 C300 2, 340 34, 400 18 L400 48 L0 48 Z" opacity="0.95" />
            <path d="M0 34 C60 18, 110 42, 170 28 C230 14, 290 40, 400 24 L400 48 L0 48 Z" opacity="0.55" />
          </svg>
          <div className="site-container flex justify-end relative">
            <p className="font-heading text-[#FF2D87] uppercase text-[clamp(1.35rem,4.5vw,3.5rem)] tracking-wide -rotate-2 drop-shadow-[0_0_24px_rgba(255,45,135,0.35)] text-right">
              Run Belong Repeat
            </p>
          </div>
        </div>
      </ParallaxSection>

      {/* ABOUT */}
      <ParallaxSection
        id="about"
        intensity={90}
        glowSide="right"
        className="py-[var(--section-pad-y)] bg-black border-t border-white/5"
      >
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">
            <div className="text-justify min-w-0">
              <p className="text-[#FF2D87] text-[0.65rem] sm:text-xs md:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4 text-left">
                About Us
              </p>
              <h2 className="font-heading text-[#FF2D87] uppercase leading-[0.95] text-[clamp(1.85rem,5vw,3.75rem)] mb-5 sm:mb-6 text-left break-words">
                More Than Just a Run
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-[#FF2D87] mb-6 sm:mb-8" />
              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed mb-5">
                <strong className="text-white">Balipu Run Club</strong> is a growing community of fitness enthusiasts in Mangaluru. We are bringing together athletes, students, and professionals to build a stronger, brighter future through active lifestyles.
              </p>
              <p className="text-white/70 text-sm sm:text-base md:text-lg leading-relaxed mb-8">
                This isn&apos;t just a one-time event. Our club is a permanent fixture in the city. We will be consistently organizing different kinds of runs, training sessions, and fitness activities to keep our community active, supported, and moving forward.
              </p>
              <div className="pt-6 border-t border-white/10 text-left">
                <p className="font-heading text-white text-lg sm:text-xl md:text-2xl tracking-wide uppercase break-words">
                  Jeethesh A &amp; Sohan Raj
                </p>
                <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-2">
                  Founders
                </p>
              </div>
            </div>

            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full max-w-lg mx-auto lg:max-w-none overflow-hidden rounded-2xl border border-[#FF2D87]/25 bg-[#0a0a0a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/About.jpeg"
                alt="Balipu Run Club founders"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 ring-1 ring-inset ring-[#FF2D87]/20 rounded-2xl pointer-events-none" />
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* EVENTS */}
      <ParallaxSection
        id="upcoming-events"
        intensity={100}
        glowSide="left"
        className="py-[var(--section-pad-y)] bg-black border-t border-white/5"
      >
        <div className="site-container min-w-0">
          <div className="mb-10 sm:mb-12 lg:mb-16">
            <p className="text-[#FF2D87] text-[0.65rem] sm:text-xs md:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4">
              Events
            </p>
            <h2 className="font-heading text-[#FF2D87] uppercase leading-[0.95] text-[clamp(1.85rem,5vw,3.75rem)] break-words">
              What&apos;s Next
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-[#FF2D87] mt-5 sm:mt-6" />
          </div>

          <Link
            href="/events/balipu-x-aloysius"
            className="group block mb-10 sm:mb-14 lg:mb-16 rounded-2xl border border-[#FF2D87]/40 bg-[#0a0a0a] overflow-hidden hover:border-[#FF2D87] transition-colors"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 min-w-0">
              <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[280px] xl:min-h-[320px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/poster2.png"
                  alt="Balipu x Aloysius"
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-black/40 lg:to-black" />
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center rounded-full bg-[#FF2D87] px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                  Upcoming
                </span>
              </div>
              <div className="relative flex flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12 min-w-0">
                <h3 className="font-heading text-white uppercase text-[clamp(1.5rem,4vw,2.25rem)] tracking-wide mb-2 break-words">
                  Balipu x Aloysius
                </h3>
                <p className="text-[#FF2D87] font-medium text-sm sm:text-base mb-4 italic">
                  Mangalore&apos;s first ever super car run
                </p>
                <p className="text-white/65 text-sm sm:text-base md:text-lg leading-relaxed mb-6 max-w-md">
                  More than a run. A full community experience: supercars, a 5K, DJ on wheels,
                  Zumba, fitness challenges, a dance battle, and a Baila to close it all out.
                </p>
                <div className="flex flex-col sm:flex-wrap sm:flex-row gap-2 sm:gap-x-6 sm:gap-y-2 text-xs sm:text-sm text-white/50 mb-6 sm:mb-8">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-[#FF2D87] shrink-0" />
                    <span className="break-words">11th October 2026</span>
                  </span>
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-[#FF2D87] shrink-0" />
                    <span className="break-words">Assembly 6:15 AM | Starts 6:30 AM</span>
                  </span>
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#FF2D87] shrink-0" />
                    Mangaluru
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 text-[#FF2D87] font-semibold text-xs sm:text-sm tracking-wide uppercase group-hover:gap-3 transition-all">
                  View full line-up & register
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </span>
              </div>
            </div>
          </Link>

          <div className="mb-8">
            <h3 className="text-white/50 text-[0.65rem] sm:text-xs font-semibold tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-5 sm:mb-6">
              Concluded Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col min-w-0">
                <div className="relative w-full aspect-[16/10] sm:aspect-auto sm:h-48 md:h-56 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/poster.png"
                    alt="The Monsoon Run"
                    className="w-full h-full object-cover object-top opacity-70 grayscale"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-black/70 text-white/90 font-bold px-3 sm:px-4 py-2 rounded-lg tracking-widest uppercase text-[0.65rem] sm:text-xs border border-white/15">
                      Completed
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6 md:p-8 flex flex-col flex-1 text-center">
                  <p className="text-[#FF2D87]/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                    Event Concluded
                  </p>
                  <h3 className="font-heading text-white/70 uppercase text-xl sm:text-2xl md:text-3xl tracking-wide mb-2 break-words">
                    The Monsoon Run
                  </h3>
                  <p className="text-white/40 font-medium text-sm">
                    12th July 2026
                    <br />
                    Fiza by nexus
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col min-w-0">
                <div className="relative w-full aspect-[16/10] sm:aspect-auto sm:h-48 md:h-56 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/dancePoster.png"
                    alt="Monsoon Dance Battle"
                    className="w-full h-full object-cover object-top opacity-70 grayscale"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-black/70 text-white/90 font-bold px-3 sm:px-4 py-2 rounded-lg tracking-widest uppercase text-[0.65rem] sm:text-xs border border-white/15">
                      Completed
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6 md:p-8 flex flex-col flex-1 text-center">
                  <p className="text-[#FF2D87]/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                    Event Concluded
                  </p>
                  <h3 className="font-heading text-white/70 uppercase text-xl sm:text-2xl md:text-3xl tracking-wide mb-2 break-words">
                    Monsoon Dance Battle
                  </h3>
                  <p className="text-white/40 font-medium text-sm">
                    12th July 2026
                    <br />
                    Fiza by nexus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
}

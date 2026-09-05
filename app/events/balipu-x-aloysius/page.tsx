'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  Clock,
  Dumbbell,
  Footprints,
  MapPin,
  Music2,
  PartyPopper,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { EventCountdown } from '@/components/EventCountdown';

const WHATSAPP_JOIN = 'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc';

const lineup = [
  {
    step: '01',
    title: 'Super Car Run',
    description:
      "Mangaluru's first-ever supercar parade opens the event, the headline spectacle of the morning.",
    icon: Car,
  },
  {
    step: '02',
    title: '5K Community Run',
    description:
      'The core run, open to students, professionals, families, and fitness enthusiasts.',
    icon: Footprints,
  },
  {
    step: '03',
    title: 'DJ on Wheels',
    description:
      'A moving DJ setup that keeps energy high along the route and venue throughout the morning.',
    icon: Music2,
  },
  {
    step: '04',
    title: 'Zumba',
    description: 'High-energy group warm-up and dance-fitness session to get everyone moving.',
    icon: Sparkles,
  },
  {
    step: '05',
    title: 'Fitness Challenges',
    description: 'On-ground challenge stations and activities for the competitive and curious alike.',
    icon: Dumbbell,
  },
  {
    step: '06',
    title: 'Dance Battle',
    description: 'A competitive dance showcase segment that brings the crowd to life.',
    icon: Trophy,
  },
  {
    step: '07',
    title: 'Baila',
    description:
      'The grand finale: a high-energy closing dance and party celebration that sends the event off on a high.',
    icon: PartyPopper,
  },
];

export default function BalipuXAloysiusPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-clip">
      {/* HERO — two columns */}
      <section className="relative pt-24 lg:pt-28 pb-12 sm:pb-16 lg:pb-20 border-b border-white/5">
        <div className="absolute right-0 top-1/4 w-[40%] h-[55%] rounded-full bg-[#FF2D87]/15 blur-[110px] pointer-events-none" />

        <div className="relative z-10 site-container">
          <Link
            href="/#upcoming-events"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:text-[#FF2D87] hover:border-[#FF2D87]/40 transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="min-w-0 break-words"
            >
              <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-5">
                Upcoming Event
              </p>

              <div className="mb-4 min-w-0">
                <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.9] text-[clamp(2.75rem,7vw,4.75rem)] break-words">
                  Balipu
                </h1>
                <p className="font-heading text-white/30 uppercase text-[clamp(1.5rem,4vw,2.5rem)] tracking-[0.2em] sm:tracking-[0.35em] my-1">
                  ×
                </p>
                <h1 className="font-heading text-[#FF2D87] uppercase leading-[0.9] text-[clamp(2.75rem,7vw,4.75rem)] break-words">
                  Aloysius
                </h1>
              </div>

              <EventCountdown className="mb-6" />

              <p className="text-[#FF2D87]/90 text-lg sm:text-xl font-medium mb-6 break-words">
                Mangalore&apos;s first ever super car run
              </p>

              <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-8 max-w-lg text-justify">
                More than a run. A full community experience: supercars, a 5K, DJ on wheels,
                Zumba, fitness challenges, a dance battle, and a Baila to close it all out.
              </p>

              <div className="flex flex-col gap-3 text-sm text-white/55 mb-10">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF2D87] shrink-0" />
                  11th October 2026
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF2D87] shrink-0" />
                  Assembly 6:15 AM | Starts 6:30 AM
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF2D87] shrink-0" />
                  Mangaluru
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-10 w-full">
                <Link
                  href="/events/balipu-x-aloysius/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-7 py-3.5 min-h-11 w-full sm:w-auto text-sm sm:text-base font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={WHATSAPP_JOIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FF2D87] px-7 py-3.5 min-h-11 w-full sm:w-auto text-sm sm:text-base font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
                >
                  Get updates on WhatsApp
                </a>
              </div>
            </motion.div>

            {/* Right — visual */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full min-w-0 overflow-hidden rounded-2xl border border-[#FF2D87]/25 bg-[#0a0a0a]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/poster2.png"
                alt="Balipu x Aloysius"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute inset-0 ring-1 ring-inset ring-[#FF2D87]/20 rounded-2xl pointer-events-none" />
              <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-[#FF2D87] px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                Upcoming
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE + EVENT INFO (left) / LINE-UP (right) */}
      <section className="relative py-12 sm:py-16 lg:py-20 border-b border-white/5 overflow-x-clip">
        <div className="absolute left-0 top-1/3 w-[30%] h-[50%] rounded-full bg-[#FF2D87]/10 blur-[100px] pointer-events-none" />
        <div className="absolute right-0 bottom-1/4 w-[35%] h-[40%] rounded-full bg-[#FF2D87]/8 blur-[100px] pointer-events-none" />

        <div className="relative z-10 site-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-start">
            {/* Left — intro + event info */}
            <div className="lg:sticky lg:top-28 space-y-10 sm:space-y-12 min-w-0 break-words">
              <div className="min-w-0">
                <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4">
                  The Experience
                </p>
                <h2 className="font-heading text-[#FF2D87] uppercase leading-[0.95] text-[clamp(2rem,5vw,3.25rem)] mb-4 break-words">
                  Full Line-Up
                </h2>
                <div className="w-20 h-1 bg-[#FF2D87] mb-6" />
                <p className="text-white/65 text-base sm:text-lg leading-relaxed max-w-md">
                  A flowing morning sequence from supercars to the Baila finale. Exact run-of-show
                  times will be confirmed with organizers before publish.
                </p>
              </div>

              {/* Event info — directly under the paragraph */}
              <div className="min-w-0">
                <p className="text-[#FF2D87] text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.35em] uppercase mb-4">
                  Details
                </p>
                <h3 className="font-heading text-[#FF2D87] uppercase text-[clamp(1.5rem,3.5vw,2.25rem)] mb-5 break-words">
                  Event Info
                </h3>
                <div className="w-20 h-1 bg-[#FF2D87] mb-6" />

                <div className="flex flex-col gap-3 sm:gap-4 mb-8">
                  {[
                    { icon: Calendar, label: 'Date', value: '11th October 2026' },
                    { icon: Clock, label: 'Assembly', value: '6:15 AM' },
                    { icon: Clock, label: 'Event starts', value: '6:30 AM' },
                    { icon: MapPin, label: 'Venue', value: 'Mangaluru' },
                  ].map((detail) => (
                    <div
                      key={detail.label}
                      className="flex items-center gap-3 sm:gap-5 rounded-2xl border border-[#FF2D87]/25 bg-[#0a0a0a] p-3 sm:p-5 min-w-0"
                    >
                      <detail.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF2D87] shrink-0" strokeWidth={1.75} />
                      <div className="min-w-0 break-words">
                        <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-0.5">
                          {detail.label}
                        </p>
                        <p className="font-heading text-white text-lg sm:text-xl uppercase tracking-wide break-words">
                          {detail.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#FF2D87]/30 bg-[#0a0a0a] p-4 sm:p-6 lg:p-8">
                  <h4 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3 break-words">
                    Stay in the loop
                  </h4>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    Join WhatsApp for updates, and register for Balipu x Aloysius on 11th October
                    2026.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      href={WHATSAPP_JOIN}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FF2D87] px-6 py-3 min-h-11 w-full text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
                    >
                      Join WhatsApp
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <Link
                      href="/events/balipu-x-aloysius/register"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-6 py-3 min-h-11 w-full text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
                    >
                      Register Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — timeline */}
            <ol className="relative min-w-0">
              <div
                className="absolute left-[1.35rem] sm:left-[1.5rem] top-3 bottom-3 w-px bg-linear-to-b from-[#FF2D87] via-[#FF2D87]/40 to-transparent"
                aria-hidden
              />

              {lineup.map((item, index) => (
                <motion.li
                  key={item.step}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="relative flex gap-3 sm:gap-6 pb-8 sm:pb-10 last:pb-0 min-w-0"
                >
                  <div className="relative z-10 shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#FF2D87]/50 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(255,45,135,0.25)]">
                    <item.icon className="w-5 h-5 text-[#FF2D87]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1 break-words">
                    <p className="text-[#FF2D87]/70 text-xs font-bold tracking-[0.2em] sm:tracking-[0.25em] mb-1">
                      {item.step}
                    </p>
                    <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-2 break-words">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

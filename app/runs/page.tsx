import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { SeoPageShell } from '@/components/SeoPageShell';
import { JsonLd, breadcrumbJsonLd, aloysiusEventJsonLd } from '@/components/JsonLd';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Upcoming Runs & Running Events in Mangaluru | Balipu Run Club',
  description:
    'See upcoming runs and running events from Balipu Run Club in Mangaluru. Dates, times, locations and registration for community runs and special events.',
  path: '/runs',
});

export default function RunsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Upcoming Runs', path: '/runs' },
          ]),
          aloysiusEventJsonLd(),
        ]}
      />
      <SeoPageShell
        eyebrow="Upcoming Runs"
        title="Upcoming Runs in Mangaluru"
        description="Discover upcoming community runs and running events organised by Balipu Run Club across Mangaluru and Mangalore."
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Upcoming Runs' },
        ]}
      >
        <article className="rounded-2xl border border-[#FF2D87]/30 bg-[#0a0a0a] p-5 sm:p-8 not-prose">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF2D87] mb-3">
            Featured upcoming run
          </p>
          <h2 className="font-heading text-white uppercase text-2xl sm:text-3xl tracking-wide mb-2">
            Balipu x Aloysius
          </h2>
          <p className="text-[#FF2D87] italic mb-4">Mangalore&apos;s first ever supercar run</p>
          <p className="text-white/65 text-sm sm:text-base mb-6 leading-relaxed">
            A full community experience from Balipu Run Club: supercars, a 5K run, DJ on wheels,
            Zumba, fitness challenges, a dance battle and Baila — in Mangaluru.
          </p>
          <ul className="space-y-2 text-sm text-white/60 mb-8">
            <li className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF2D87] shrink-0" />
              11th October 2026
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF2D87] shrink-0" />
              Assembly 6:15 AM · Starts 6:30 AM
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF2D87] shrink-0" />
              Mangaluru, Karnataka
            </li>
            <li className="text-white/50 pl-6">Distance highlight: 5K community run</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/events/balipu-x-aloysius/register"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
            >
              Register now
            </Link>
            <Link
              href="/events/balipu-x-aloysius"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
            >
              Event details
            </Link>
          </div>
        </article>

        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-3">
            How Balipu runs work
          </h2>
          <p>
            Balipu Run Club regularly hosts community runs for runners in Mangaluru — including
            beginners. Check this page and our{' '}
            <Link href="/events" className="text-[#FF2D87] hover:underline">
              events
            </Link>{' '}
            list for the latest dates, or{' '}
            <Link href="/join" className="text-[#FF2D87] hover:underline">
              join the club
            </Link>{' '}
            to get updates.
          </p>
        </section>
      </SeoPageShell>
    </>
  );
}

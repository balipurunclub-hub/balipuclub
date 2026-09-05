import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageShell } from '@/components/SeoPageShell';
import { JsonLd, breadcrumbJsonLd, aloysiusEventJsonLd } from '@/components/JsonLd';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Running Events in Mangaluru | Balipu Run Club',
  description:
    'Running events in Mangaluru by Balipu Run Club — 5K runs, community runs, special events and past experiences across Mangalore and Coastal Karnataka.',
  path: '/events',
  image: '/balipuxaloy.jpeg',
});

export default function EventsIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Events', path: '/events' },
          ]),
          aloysiusEventJsonLd(),
        ]}
      />
      <SeoPageShell
        eyebrow="Events"
        title="Running Events in Mangaluru"
        description="From community 5Ks to signature experiences — explore running events organised by Balipu Run Club in Mangaluru (Mangalore)."
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Events' },
        ]}
      >
        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-4">
            Upcoming events
          </h2>
          <Link
            href="/events/balipu-x-aloysius"
            className="block rounded-2xl border border-[#FF2D87]/30 bg-[#0a0a0a] overflow-hidden hover:border-[#FF2D87] transition-colors not-prose"
          >
            <div className="relative aspect-[3/2] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/balipuxaloy.jpeg"
                alt="Balipu x Aloysius supercar run event poster in Mangaluru"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF2D87] mb-2">
                Upcoming · 11 Oct 2026
              </p>
              <h3 className="font-heading text-white uppercase text-xl tracking-wide mb-2">
                Balipu x Aloysius
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Mangalore&apos;s first supercar run with a 5K community run and a full festival
                line-up — organised with Balipu Run Club.
              </p>
              <span className="text-[#FF2D87] text-sm font-semibold">View event →</span>
            </div>
          </Link>
        </section>

        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-3">
            Types of Balipu events
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3 not-prose">
            {[
              { t: '5K runs', d: 'Accessible community distances for new and returning runners.' },
              { t: 'Community runs', d: 'Social morning and weekend runs across Mangaluru.' },
              { t: 'Special events', d: 'Signature experiences that celebrate the city and culture.' },
              { t: 'Fitness sessions', d: 'Training and movement sessions for the Balipu community.' },
            ].map((item) => (
              <li
                key={item.t}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <h3 className="text-white font-semibold mb-1">{item.t}</h3>
                <p className="text-white/55 text-sm">{item.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <p>
          Ready to take part?{' '}
          <Link href="/runs" className="text-[#FF2D87] hover:underline">
            See upcoming runs
          </Link>{' '}
          or{' '}
          <Link href="/events/balipu-x-aloysius/register" className="text-[#FF2D87] hover:underline">
            register for Balipu x Aloysius
          </Link>
          .
        </p>
      </SeoPageShell>
    </>
  );
}

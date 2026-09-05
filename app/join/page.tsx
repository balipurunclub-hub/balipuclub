import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageShell } from '@/components/SeoPageShell';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { pageMeta, WHATSAPP_JOIN } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Join Balipu Run Club | Mangaluru Running Community',
  description:
    'Join Balipu Run Club — Mangaluru\'s running community. Sign up for events, join the WhatsApp group, and start running with Balipu.',
  path: '/join',
});

export default function JoinPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Join', path: '/join' },
        ])}
      />
      <SeoPageShell
        eyebrow="Join"
        title="Join Balipu Run Club"
        description="Become part of Mangaluru's running community. Beginners welcome — Balipu Run Club is built for every pace."
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Join' },
        ]}
      >
        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-3">
            How to join
          </h2>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              Join the{' '}
              <a href={WHATSAPP_JOIN} className="text-[#FF2D87] hover:underline" target="_blank" rel="noopener noreferrer">
                Balipu WhatsApp community
              </a>{' '}
              for run updates.
            </li>
            <li>
              Register for upcoming events like{' '}
              <Link href="/events/balipu-x-aloysius/register" className="text-[#FF2D87] hover:underline">
                Balipu x Aloysius
              </Link>
              .
            </li>
            <li>
              Follow schedules on{' '}
              <Link href="/runs" className="text-[#FF2D87] hover:underline">
                upcoming runs
              </Link>{' '}
              and show up ready to run.
            </li>
          </ol>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 not-prose pt-2">
          <a
            href={WHATSAPP_JOIN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
          >
            Join Balipu Run Club
          </a>
          <Link
            href="/events/balipu-x-aloysius/register"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
          >
            Register for an event
          </Link>
        </div>
      </SeoPageShell>
    </>
  );
}

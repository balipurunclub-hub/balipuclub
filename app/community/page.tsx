import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageShell } from '@/components/SeoPageShell';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { pageMeta, WHATSAPP_JOIN, INSTAGRAM } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: "Balipu Running Community | Join Mangaluru's Running Community",
  description:
    "Join Balipu's running community in Mangaluru — a welcoming runners group for beginners and experienced runners across Mangalore and Coastal Karnataka.",
  path: '/community',
});

export default function CommunityPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Community', path: '/community' },
        ])}
      />
      <SeoPageShell
        eyebrow="Community"
        title="Balipu Running Community"
        description="Balipu is more than a run club — it is a running community in Mangaluru built on friendship, consistency and shared miles."
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Community' },
        ]}
      >
        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-3">
            Who runs with Balipu
          </h2>
          <p>
            Students, professionals, first-time runners and seasoned athletes. If you are looking
            for runners in Mangaluru, a social running club, or simply running friends for weekend
            miles — you belong here.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-3">
            Community activities
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Group runs and easy social paces</li>
            <li>Event days and city celebrations</li>
            <li>Fitness challenges and warm-ups</li>
            <li>Shared stories from the streets of Mangaluru (Kudla)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-3">
            Stay connected
          </h2>
          <p className="mb-4">
            Follow Balipu Run Club on Instagram and join the WhatsApp community for schedules and
            meet-up details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 not-prose">
            <a
              href={WHATSAPP_JOIN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
            >
              Join WhatsApp community
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#FF2D87]/10 transition-colors"
            >
              Instagram
            </a>
            <Link
              href="/gallery"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:text-white transition-colors"
            >
              Gallery
            </Link>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}

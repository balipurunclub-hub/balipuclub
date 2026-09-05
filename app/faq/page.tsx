import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageShell } from '@/components/SeoPageShell';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { pageMeta, WHATSAPP_JOIN } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Balipu Run Club FAQ | Running in Mangaluru',
  description:
    'Frequently asked questions about Balipu Run Club — joining, beginner runs, event registration, and running in Mangaluru.',
  path: '/faq',
});

const FAQS = [
  {
    q: 'What is Balipu Run Club?',
    a: 'Balipu Run Club is a running community based in Mangaluru, Karnataka. We organise community runs, running events and fitness experiences for runners of all levels.',
  },
  {
    q: 'Where does Balipu Run Club run?',
    a: 'Balipu runs and events take place in and around Mangaluru (Mangalore) in Coastal Karnataka. Exact meeting points are shared for each run or event.',
  },
  {
    q: 'How can I join Balipu Run Club?',
    a: 'Join our WhatsApp community for updates, follow Balipu on Instagram, and register for upcoming events on this website. Visit the Join page to get started.',
  },
  {
    q: 'Is Balipu Run Club beginner friendly?',
    a: 'Yes. Balipu welcomes beginners as well as experienced runners. Community runs are social and inclusive — every pace belongs.',
  },
  {
    q: 'Are Balipu runs free?',
    a: 'Many community meet-ups are free or low-cost. Flagship events may have phased registration fees. Check each event page for current pricing.',
  },
  {
    q: 'How often does Balipu Run Club organize runs?',
    a: 'Balipu regularly organises community runs and special events. Schedules are announced on WhatsApp, Instagram and the Upcoming Runs page.',
  },
  {
    q: 'What distances can I run with Balipu?',
    a: 'Distances vary by event — from easy community runs to 5K challenges and special formats. Details are listed on each event page.',
  },
  {
    q: 'How do I register for a Balipu event?',
    a: 'Open the event page (for example Balipu x Aloysius), tap Register, complete the short form, and pay if the event is in a paid phase.',
  },
  {
    q: 'Where can I find upcoming Balipu runs?',
    a: 'See Upcoming Runs and Events on this website, or join the Balipu WhatsApp community for the latest announcements.',
  },
];

export default function FaqPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
          faqSchema,
        ]}
      />
      <SeoPageShell
        eyebrow="FAQ"
        title="Balipu Run Club FAQ"
        description="Answers about joining Balipu, running in Mangaluru, and registering for events."
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'FAQ' },
        ]}
      >
        <div className="space-y-4 not-prose">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-5 open:border-[#FF2D87]/30"
            >
              <summary className="cursor-pointer list-none font-semibold text-white pr-6 relative">
                {f.q}
                <span className="absolute right-0 top-0 text-[#FF2D87] group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-white/65 text-sm sm:text-base leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="pt-4">
          Still have questions?{' '}
          <Link href="/contact" className="text-[#FF2D87] hover:underline">
            Contact Balipu Run Club
          </Link>{' '}
          or{' '}
          <a href={WHATSAPP_JOIN} className="text-[#FF2D87] hover:underline" target="_blank" rel="noopener noreferrer">
            message the community
          </a>
          .
        </p>
      </SeoPageShell>
    </>
  );
}

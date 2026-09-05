import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoPageShell } from '@/components/SeoPageShell';
import { JsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { pageMeta, INSTAGRAM } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Contact Balipu Run Club | Mangaluru',
  description:
    'Contact Balipu Run Club in Mangaluru — email, phone and social channels for running events, partnerships and community questions.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Balipu Run Club',
            url: 'https://balipuclub.in/contact',
            mainEntity: {
              '@type': 'SportsOrganization',
              name: 'Balipu Run Club',
              email: 'Balipurunclub@gmail.com',
              telephone: ['+91-8317380741', '+91-7349791297'],
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Mangaluru',
                addressRegion: 'Karnataka',
                addressCountry: 'IN',
              },
            },
          },
        ]}
      />
      <SeoPageShell
        eyebrow="Contact"
        title="Contact Balipu Run Club"
        description="Reach the Balipu team in Mangaluru for event questions, partnerships, or community enquiries."
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Contact' },
        ]}
      >
        <section className="not-prose space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 sm:p-6">
            <h2 className="font-heading text-white uppercase tracking-wide text-lg mb-4">
              Get in touch
            </h2>
            <ul className="space-y-3 text-white/70 text-sm sm:text-base">
              <li>
                <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Email</span>
                <a href="mailto:Balipurunclub@gmail.com" className="text-[#FF2D87] hover:underline break-all">
                  Balipurunclub@gmail.com
                </a>
              </li>
              <li>
                <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Phone</span>
                <a href="tel:+918317380741" className="hover:text-[#FF2D87]">+91 8317380741</a>
                <span className="text-white/30"> · </span>
                <a href="tel:+917349791297" className="hover:text-[#FF2D87]">+91 7349791297</a>
              </li>
              <li>
                <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Location</span>
                Mangaluru (Mangalore), Karnataka, India
              </li>
              <li>
                <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Founders</span>
                Jeethesh A &amp; Sohan Raj
              </li>
              <li>
                <span className="text-white/40 block text-xs uppercase tracking-wider mb-1">Instagram</span>
                <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-[#FF2D87] hover:underline">
                  @balipurunclub
                </a>
              </li>
            </ul>
          </div>
        </section>

        <p>
          Looking for answers first? Visit the{' '}
          <Link href="/faq" className="text-[#FF2D87] hover:underline">
            Balipu Run Club FAQ
          </Link>
          .
        </p>
      </SeoPageShell>
    </>
  );
}

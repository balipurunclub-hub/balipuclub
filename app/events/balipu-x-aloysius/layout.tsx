import type { Metadata } from 'next';
import { JsonLd, aloysiusEventJsonLd, breadcrumbJsonLd } from '@/components/JsonLd';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: "Balipu x Aloysius | Mangalore's First Supercar Run",
  description:
    "Balipu Run Club presents Balipu x Aloysius — Mangalore's first supercar run with a 5K community run, DJ on wheels, Zumba, fitness challenges, dance battle and Baila in Mangaluru.",
  path: '/events/balipu-x-aloysius',
  image: '/balipuxaloy.jpeg',
});

export default function BalipuXAloysiusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          aloysiusEventJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Events', path: '/events' },
            { name: 'Balipu x Aloysius', path: '/events/balipu-x-aloysius' },
          ]),
        ]}
      />
      {children}
    </>
  );
}

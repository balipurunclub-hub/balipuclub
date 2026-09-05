import type { Metadata } from 'next';
import { HomePage } from '@/components/HomePage';
import { JsonLd, organizationJsonLd, aloysiusEventJsonLd } from '@/components/JsonLd';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Balipu Run Club | Running Community in Mangaluru',
  description:
    'Balipu Run Club is a running community in Mangaluru bringing runners together through community runs, running events, training, fitness and unforgettable experiences.',
  path: '/',
});

export default function Home() {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), aloysiusEventJsonLd()]} />
      <HomePage />
    </>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Balipu x Aloysius | Mangalore’s First Ever Super Car Run',
  description:
    'More than a run. A full community experience: supercars, a 5K, DJ on wheels, Zumba, fitness challenges, a dance battle, and a Baila to close it all out.',
  keywords: [
    'Balipu x Aloysius',
    'super car run Mangaluru',
    'Mangalore supercar',
    '5K community run',
    'Balipu Run Club',
    'Aloysius',
  ],
  openGraph: {
    title: 'Balipu x Aloysius | Super Car Run',
    description:
      "Mangalore's first ever super car run, plus a 5K, DJ on wheels, Zumba, fitness challenges, dance battle, and Baila.",
    url: 'https://balipu.vercel.app/events/balipu-x-aloysius',
    images: [{ url: '/poster2.png', width: 1200, height: 630, alt: 'Balipu x Aloysius' }],
  },
};

export default function BalipuXAloysiusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

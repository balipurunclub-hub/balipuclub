import { Metadata } from 'next';

const eventMetadata = {
  'balipu-x-aloysius': {
    title: 'Balipu x Aloysius | Mangalore’s First Ever Super Car Run',
    description:
      'More than a run. A full community experience: supercars, a 5K, DJ on wheels, Zumba, fitness challenges, a dance battle, and a Baila to close it all out.',
    keywords: [
      'Balipu x Aloysius',
      'super car run Mangaluru',
      'Mangalore supercar',
      '5K community run',
      'Balipu Run Club',
    ],
  },
  'next-run': {
    title: 'Balipu x Aloysius | Balipu Run Club',
    description:
      'More than a run. A full community experience: supercars, a 5K, DJ on wheels, Zumba, fitness challenges, a dance battle, and a Baila.',
    keywords: ['Balipu x Aloysius', 'community run Mangaluru', 'super car run'],
  },
  'monsoon-run': {
    title: 'The Monsoon Run 2026 | Balipu Run Club',
    description: 'Join The Monsoon Run 2026 in Mangaluru. Register now for this premium running event organized by Balipu Run Club with Decathlon, JCI, and Canara Bank.',
    keywords: ['Monsoon Run', 'running event Mangaluru', 'marathon 2026', 'fitness event', 'Balipu'],
  },
  'monsoon-dancebattle': {
    title: 'Monsoon Dance Battle 2026 | Balipu Run Club',
    description: 'Experience the ultimate street dance showdown at Monsoon Dance Battle 2026. Solo battle event with cash prizes in Mangaluru.',
    keywords: ['dance battle', 'street dance', 'Mangaluru events', 'dance competition', 'Balipu'],
  },
};

export function getEventMetadata(eventId: string): Metadata {
  const event = eventMetadata[eventId as keyof typeof eventMetadata];

  if (!event) {
    return {
      title: 'Event Not Found | Balipu Run Club',
      description: 'The event you are looking for does not exist.',
    };
  }

  return {
    title: event.title,
    description: event.description,
    keywords: event.keywords,
    openGraph: {
      title: event.title,
      description: event.description,
      type: 'website',
      url: `https://balipu.vercel.app/events/${eventId}`,
      siteName: 'Balipu Run Club',
      images: [
        {
          url:
            eventId === 'monsoon-run'
              ? '/poster.png'
              : eventId === 'balipu-x-aloysius' || eventId === 'next-run'
                ? '/poster2.png'
                : '/dancePoster.png',
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
    },
  };
}

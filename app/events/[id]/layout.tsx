import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover upcoming running events, fitness activities, and community gatherings organized by Balipu Run Club in Mangaluru.',
  openGraph: {
    title: 'Events | Balipu Run Club',
    description: 'Discover upcoming running events and fitness activities in Mangaluru.',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

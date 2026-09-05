import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Your Ticket',
};

export default function TicketLayout({ children }: { children: React.ReactNode }) {
  return children;
}

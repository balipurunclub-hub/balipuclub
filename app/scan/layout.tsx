import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'QR Scanner',
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}

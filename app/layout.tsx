import type { Metadata } from "next";
import { Poppins, Anton, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-inter"
});
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-script" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Balipu Run Club | Running Community in Mangaluru",
    template: "%s | Balipu Run Club"
  },
  description:
    "Balipu Run Club is a running community in Mangaluru bringing runners together through community runs, running events, training, fitness and unforgettable experiences.",
  keywords: [
    "Balipu Run Club",
    "Balipu",
    "Balipu Club",
    "Balipu Running Club",
    "Balipu Run Club Mangaluru",
    "Balipu Run Club Mangalore",
    "running club Mangaluru",
    "running club Mangalore",
    "running community Mangaluru",
    "running events Mangaluru",
    "5K Mangalore",
    "runners in Mangaluru",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Balipu Run Club | Running Community in Mangaluru',
    description:
      'Balipu Run Club is a running community in Mangaluru bringing runners together through community runs, running events, training and fitness.',
    images: [
      {
        url: '/IMG_3702.PNG',
        width: 1200,
        height: 630,
        alt: 'Balipu Run Club — Mangaluru running community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balipu Run Club | Running Community in Mangaluru',
    description:
      'Join Balipu Run Club — Mangaluru\'s running community for group runs, events and fitness.',
    images: ['/IMG_3702.PNG'],
    creator: '@balipurunclub',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className={`${poppins.variable} ${anton.variable} ${greatVibes.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden`}>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
      </body>
    </html>
  );
}

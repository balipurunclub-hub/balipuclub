import type { Metadata } from "next";
import { Poppins, Anton } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const viewport = {
  themeColor: '#1B1B4D',
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

export const metadata: Metadata = {
  title: {
    default: "Balipu Run Club | Mangaluru's Premier Running Community",
    template: "%s | Balipu Run Club"
  },
  description: "Join Mangaluru's premier running community. Register for The Monsoon Run 2026, fitness events, and connect with fellow runners. Run for a better tomorrow.",
  keywords: ["Balipu Run Club", "Mangaluru running", "Monsoon Run 2026", "fitness events Mangaluru", "running community Karnataka", "marathon Mangaluru"],
  authors: [{ name: "Balipu Run Club" }],
  creator: "Balipu Run Club",
  publisher: "Balipu Run Club",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://balipu.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://balipu.vercel.app',
    siteName: 'Balipu Run Club',
    title: 'Balipu Run Club | Mangaluru\'s Premier Running Community',
    description: 'Join Mangaluru\'s premier running community. Register for The Monsoon Run 2026, fitness events, and connect with fellow runners.',
    images: [
      {
        url: '/IMG_3702.PNG',
        width: 1200,
        height: 630,
        alt: 'Balipu Run Club Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balipu Run Club | Mangaluru\'s Premier Running Community',
    description: 'Join Mangaluru\'s premier running community. Register for The Monsoon Run 2026 and connect with fellow runners.',
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${anton.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';

export const SITE_URL = 'https://balipuclub.in';
export const SITE_NAME = 'Balipu Run Club';
export const SITE_SHORT = 'Balipu';

export const ORGANIZATION = {
  name: 'Balipu Run Club',
  alternateName: ['Balipu', 'Balipu Club', 'Balipu Running Club', 'Balipu Runners'],
  url: SITE_URL,
  logo: `${SITE_URL}/IMG_3702.PNG`,
  description:
    'Balipu Run Club is a running community in Mangaluru, Karnataka bringing runners together through community runs, running events, training, fitness and shared experiences.',
  email: 'Balipurunclub@gmail.com',
  telephone: ['+91-8317380741', '+91-7349791297'],
  address: {
    addressLocality: 'Mangaluru',
    addressRegion: 'Karnataka',
    addressCountry: 'IN',
  },
  sameAs: [
    'https://www.instagram.com/balipuclub/',
    'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc',
  ],
} as const;

export const WHATSAPP_JOIN = 'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc';
export const INSTAGRAM = 'https://www.instagram.com/balipuclub/';

export function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function pageMeta({
  title,
  description,
  path,
  image = '/IMG_3702.PNG',
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@balipurunclub',
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

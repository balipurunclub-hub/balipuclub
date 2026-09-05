export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'SportsOrganization'],
    name: 'Balipu Run Club',
    alternateName: ['Balipu', 'Balipu Club', 'Balipu Running Club'],
    url: 'https://balipuclub.in',
    logo: 'https://balipuclub.in/IMG_3702.PNG',
    description:
      'Balipu Run Club is a running community based in Mangaluru, Karnataka. Join runners across Mangaluru for community runs, fitness activities and running events.',
    email: 'Balipurunclub@gmail.com',
    telephone: '+91-8317380741',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mangaluru',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    areaServed: [
      { '@type': 'City', name: 'Mangaluru' },
      { '@type': 'City', name: 'Mangalore' },
      { '@type': 'State', name: 'Karnataka' },
    ],
    sameAs: [
      'https://www.instagram.com/balipuclub/',
      'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc',
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `https://balipuclub.in${item.path}`,
    })),
  };
}

export function aloysiusEventJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: 'Balipu x Aloysius — Mangalore\'s First Supercar Run',
    description:
      'Balipu Run Club and St. Aloysius present Mangalore\'s first ever supercar run, plus a 5K community run, DJ on wheels, Zumba, fitness challenges, dance battle and Baila.',
    startDate: '2026-10-11T06:30:00+05:30',
    endDate: '2026-10-11T12:00:00+05:30',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: ['https://balipuclub.in/balipuxaloy.jpeg'],
    url: 'https://balipuclub.in/events/balipu-x-aloysius',
    location: {
      '@type': 'Place',
      name: 'Mangaluru',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Mangaluru',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: 'Balipu Run Club',
      url: 'https://balipuclub.in',
    },
    offers: {
      '@type': 'Offer',
      url: 'https://balipuclub.in/events/balipu-x-aloysius/register',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'INR',
    },
  };
}

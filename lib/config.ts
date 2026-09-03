export const SITE_CONFIG = {
  name: 'Balipu Run Club',
  description: 'Mangaluru\'s premier community of runners and fitness enthusiasts',
  url: 'https://balipu.vercel.app',
  email: 'Balipurunclub@gmail.com',
  phone: '+91 8317380741',
  phone2: '+91 7349791297',
  address: 'Mangaluru, Karnataka, India',
  city: 'Mangaluru',
  state: 'Karnataka',
  country: 'India',
  socialLinks: {
    whatsapp: 'https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc',
    instagram: 'https://www.instagram.com/balipurunclub',
  },
  events: {
    monsoonRun: {
      name: 'The Monsoon Run',
      date: '2026-07-12',
      venue: 'Fiza by Nexus, Mangaluru',
    },
    danceBattle: {
      name: 'Monsoon Dance Battle',
      date: '2026-07-12',
      venue: 'Fiza by Nexus, Mangaluru',
    },
  },
} as const;

export const EVENT_NAMES = {
  MONSOON_RUN: 'The Monsoon Run',
  DANCE_BATTLE: 'Monsoon Dance Battle',
} as const;

export const VENUE_NAMES = {
  FIZA_BY_NEXUS: 'Fiza by Nexus',
} as const;

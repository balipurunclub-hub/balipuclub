export const BRAND_COLORS = {
  primary: '#1B1B4D',
  accent: '#F5841F',
  secondary: '#6B2FA0',
} as const;

export const EVENT_CONFIG = {
  name: 'The Monsoon Run',
  date: '12th July 2026',
  time: '6:30 AM',
  venue: 'Decathlon, Bharath Mall',
  ticketPrefix: 'BRC-MR-',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const EMAIL_CONFIG = {
  BATCH_SIZE: 10,
  RATE_LIMIT_DELAY_MS: 1000,
} as const;

import { Metadata } from 'next';

export const adminMetadata: Metadata = {
  title: 'Admin Dashboard | Balipu Run Club',
  description: 'Admin dashboard for managing event registrations, bulk uploads, email dispatch, and QR scanner controls.',
  robots: {
    index: false,
    follow: false,
  },
};

export const scannerMetadata: Metadata = {
  title: 'QR Scanner | Balipu Run Club',
  description: 'Real-time ticket scanning and attendance tracking for Balipu Run Club events.',
  robots: {
    index: false,
    follow: false,
  },
};

export const loginMetadata: Metadata = {
  title: 'Login | Balipu Run Club',
  description: 'Secure login for Balipu Run Club admin and scanner access.',
  robots: {
    index: false,
    follow: false,
  },
};

export const ticketMetadata: Metadata = {
  title: 'Your Ticket | Balipu Run Club',
  description: 'View and manage your Balipu Run Club event ticket with QR code.',
  robots: {
    index: false,
    follow: false,
  },
};

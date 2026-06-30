import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export const REGISTRATION_FEE_PAISE =
  parseInt(process.env.NEXT_PUBLIC_REGISTRATION_FEE || '299') * 100; // Razorpay uses paise

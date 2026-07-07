// src/types/index.ts
import { Timestamp } from 'firebase/firestore';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Registration {
  uid: string;
  ticketId?: string;
  bibNumber?: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  city: string;
  emergencyContact: string;
  idProofType: string;
  idProofNumber: string;
  source: string;
  jerseySize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  paymentStatus: PaymentStatus;
  orderId?: string;
  paymentId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  attended?: boolean;
  attendedAt?: Timestamp;
  entryType?: 'paid' | 'free';
  emailSent?: boolean;
}

export interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  city: string;
  emergencyContact: string;
  idProofType: string;
  idProofNumber: string;
  source: string;
  jerseySize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  declarationAgreed: boolean;
}

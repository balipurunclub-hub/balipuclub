export type PaymentStatus = 'pending' | 'paid' | 'failed';

/** Lightweight timestamp shape (compatible with prior Firestore Timestamp usage). */
export type AppTimestamp = {
  seconds: number;
  nanoseconds: number;
};

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
  idProofType?: string;
  idProofNumber?: string;
  source: string;
  jerseySize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'N/A' | string;
  paymentStatus: PaymentStatus;
  orderId?: string;
  paymentId?: string;
  createdAt: AppTimestamp | Date | string;
  updatedAt?: AppTimestamp | Date | string;
  attended?: boolean;
  attendedAt?: AppTimestamp | Date | string;
  entryType?: 'paid' | 'free';
  emailSent?: boolean;
  eventId?: string;
  eventName?: string;
  feeRupees?: number;
  pricingPhase?: number;
}

export interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  city: string;
  emergencyContact: string;
  source: string;
  jerseySize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  declarationAgreed: boolean;
}

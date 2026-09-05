import type { RegistrationRow } from '@/lib/db/schema';
import type { Registration } from '@/types';

/** Map DB row → app Registration shape (uid = id). Dates as ISO strings for JSON. */
export function toRegistration(row: RegistrationRow): Registration {
  return {
    uid: row.id,
    ticketId: row.ticketId ?? undefined,
    bibNumber: row.bibNumber ?? undefined,
    name: row.name,
    email: row.email,
    phone: row.phone,
    age: row.age,
    gender: row.gender as Registration['gender'],
    city: row.city,
    emergencyContact: row.emergencyContact,
    idProofType: row.idProofType ?? undefined,
    idProofNumber: row.idProofNumber ?? undefined,
    source: row.source,
    jerseySize: row.jerseySize as Registration['jerseySize'],
    paymentStatus: row.paymentStatus as Registration['paymentStatus'],
    orderId: row.orderId ?? undefined,
    paymentId: row.paymentId ?? undefined,
    entryType: (row.entryType as Registration['entryType']) ?? undefined,
    emailSent: row.emailSent ?? undefined,
    attended: row.attended ?? undefined,
    attendedAt: row.attendedAt ? row.attendedAt.toISOString() : undefined,
    eventId: row.eventId ?? undefined,
    eventName: row.eventName ?? undefined,
    feeRupees: row.feeRupees ?? undefined,
    pricingPhase: row.pricingPhase ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
  };
}

export function formatRegDate(
  value: Registration['createdAt'] | Registration['attendedAt'] | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!value) return 'N/A';
  let date: Date;
  if (typeof value === 'string' || value instanceof Date) {
    date = new Date(value);
  } else if (typeof value === 'object' && 'seconds' in value) {
    date = new Date(value.seconds * 1000);
  } else {
    return 'N/A';
  }
  if (Number.isNaN(date.getTime())) return 'N/A';
  return opts ? date.toLocaleString('en-IN', opts) : date.toLocaleString('en-IN');
}

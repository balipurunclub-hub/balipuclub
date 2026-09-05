import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('scanner'), // 'admin' | 'scanner'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const registrations = pgTable('registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: text('ticket_id').unique(),
  bibNumber: integer('bib_number'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  city: text('city').notNull(),
  emergencyContact: text('emergency_contact').notNull(),
  idProofType: text('id_proof_type'),
  idProofNumber: text('id_proof_number'),
  source: text('source').notNull(),
  jerseySize: text('jersey_size').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'), // pending | paid | failed
  orderId: text('order_id'),
  paymentId: text('payment_id'),
  entryType: text('entry_type').default('paid'), // paid | free
  emailSent: boolean('email_sent').default(false),
  attended: boolean('attended').default(false),
  attendedAt: timestamp('attended_at', { withTimezone: true }),
  eventId: text('event_id'),
  eventName: text('event_name'),
  feeRupees: integer('fee_rupees'),
  pricingPhase: integer('pricing_phase'),
  pricingTierId: text('pricing_tiers_id'),
  linkedDocId: text('linked_doc_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const eventCounters = pgTable('event_counters', {
  id: text('id').primaryKey(),
  count: integer('count').notNull().default(1000),
  confirmedCount: integer('confirmed_count').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const scannerSettings = pgTable('scanner_settings', {
  id: text('id').primaryKey().default('default'),
  allowFreeTierScan: boolean('allow_free_tiers_scan').notNull().default(true),
  allowPaidTierScan: boolean('allow_paid_tiers_scan').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { registrationSettings } from '@/lib/db/schema';
import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';

/** Midnight IST on 7 September 2026 */
export const ALOYSIUS_REGISTRATION_UNLOCK_AT = new Date('2026-09-07T00:00:00+05:30');

export const ALOYSIUS_REGISTRATION_UNLOCK_LABEL =
  '7 September 2026, 12:00 AM IST';

async function ensureRegistrationSettings() {
  const rows = await db
    .select()
    .from(registrationSettings)
    .where(eq(registrationSettings.id, ALOYSIUS_EVENT_ID))
    .limit(1);

  if (rows[0]) return rows[0];

  const [created] = await db
    .insert(registrationSettings)
    .values({
      id: ALOYSIUS_EVENT_ID,
      isOpen: false,
      scheduledUnlockApplied: false,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  return (
    await db
      .select()
      .from(registrationSettings)
      .where(eq(registrationSettings.id, ALOYSIUS_EVENT_ID))
      .limit(1)
  )[0];
}

/**
 * Returns whether registration is open.
 * At ALOYSIUS_REGISTRATION_UNLOCK_AT, opens once automatically.
 * After that, admin lock/unlock fully controls access.
 */
export async function getRegistrationAccess() {
  const settings = await ensureRegistrationSettings();
  const now = new Date();
  const scheduledReached = now.getTime() >= ALOYSIUS_REGISTRATION_UNLOCK_AT.getTime();

  let isOpen = settings?.isOpen ?? false;
  let autoUnlocked = false;
  const alreadyApplied = settings?.scheduledUnlockApplied ?? false;

  if (scheduledReached && !alreadyApplied) {
    const [row] = await db
      .update(registrationSettings)
      .set({
        isOpen: true,
        scheduledUnlockApplied: true,
        updatedAt: new Date(),
      })
      .where(eq(registrationSettings.id, ALOYSIUS_EVENT_ID))
      .returning();
    isOpen = row?.isOpen ?? true;
    autoUnlocked = true;
  }

  return {
    isOpen,
    autoUnlocked,
    scheduledUnlockAt: ALOYSIUS_REGISTRATION_UNLOCK_AT.toISOString(),
    scheduledUnlockLabel: ALOYSIUS_REGISTRATION_UNLOCK_LABEL,
    scheduledReached,
    scheduledUnlockApplied: alreadyApplied || autoUnlocked,
    updatedAt: settings?.updatedAt?.toISOString() ?? null,
  };
}

export async function setRegistrationOpen(isOpen: boolean) {
  await ensureRegistrationSettings();
  const [row] = await db
    .update(registrationSettings)
    .set({ isOpen, updatedAt: new Date() })
    .where(eq(registrationSettings.id, ALOYSIUS_EVENT_ID))
    .returning();

  return {
    isOpen: row?.isOpen ?? isOpen,
    scheduledUnlockAt: ALOYSIUS_REGISTRATION_UNLOCK_AT.toISOString(),
    scheduledUnlockLabel: ALOYSIUS_REGISTRATION_UNLOCK_LABEL,
    updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

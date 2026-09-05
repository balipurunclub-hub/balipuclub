import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAloysiusConfirmedCount } from '../lib/aloysiusRegistration';
import { getPricingForCount, PRICING_TIERS } from '../lib/registrationPhases';
import { db } from '../lib/db';
import { eventCounters, registrations } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const confirmedCount = await getAloysiusConfirmedCount();
  const active = getPricingForCount(confirmedCount);
  const regs = await db.select({ count: sql<number>`count(*)::int` }).from(registrations);
  const counters = await db.select().from(eventCounters);

  const samples = [0, 9, 10, 11, 100, 101, 200, 201, 300, 301].map((n) => ({
    afterConfirmed: n,
    next: getPricingForCount(n),
  }));

  console.log(
    JSON.stringify(
      {
        db: {
          registrations: regs[0]?.count ?? 0,
          counters: counters.map((c) => ({
            id: c.id,
            count: c.count,
            confirmedCount: c.confirmedCount,
          })),
        },
        live: { confirmedCount, active },
        phaseTable: PRICING_TIERS.map((t) => ({
          id: t.id,
          slots: `${t.minSlot}-${t.maxSlot ?? '∞'}`,
          fee: t.feeRupees,
        })),
        sampleTransitions: samples.map((s) => ({
          confirmed: s.afterConfirmed,
          nextSlot: s.next.nextSlot,
          fee: s.next.feeRupees,
          label: s.next.label,
        })),
        razorpay: {
          hasKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
          hasSecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
          hasPublicKey: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
          keysMatch:
            process.env.RAZORPAY_KEY_ID === process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
            Boolean(process.env.RAZORPAY_KEY_ID),
          emailConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        },
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

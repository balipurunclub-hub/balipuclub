import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env', override: false });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { registrations } from '@/lib/db/schema';
import { eq, and, isNull, or, desc } from 'drizzle-orm';

type Row = typeof registrations.$inferSelect;

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL env var is not set.');
    process.exit(1);
  }

  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient);

  console.log('\n==================================================');
  console.log('  AUDIT: PENDING ROWS WITH RAZORPAY PAYMENT ID');
  console.log('  (Paid at Razorpay but stuck in paymentStatus=pending)');
  console.log('==================================================\n');

  const allPending: Row[] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.paymentStatus, 'pending'))
    .orderBy(desc(registrations.createdAt));

  console.log(`Total pending rows: ${allPending.length}`);

  // Group: paymentId present = Razorpay actually returned a payment_id
  // (verify callback ran at least partially but maybe failed, or user went back etc.)
  const withPaymentId = allPending.filter(
    (r) => r.paymentId && r.paymentId !== 'FREE' && r.paymentId !== 'MANUAL_ADMIN_CONFIRM'
  );
  const noPaymentId = allPending.filter(
    (r) => !r.paymentId || r.paymentId === 'FREE' || r.paymentId === 'MANUAL_ADMIN_CONFIRM'
  );

  console.log(`\n  With paymentId (most likely paid at Razorpay): ${withPaymentId.length}`);
  console.log(`  Without paymentId (never reached Razorpay success): ${noPaymentId.length}\n`);

  if (withPaymentId.length > 0) {
    console.log('====================================================');
    console.log('  POTENTIALLY PAID BUT STUCK IN PENDING:');
    console.log('====================================================');

    withPaymentId.forEach((r, i) => {
      const created = r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '-';
      console.log(`\n#${i + 1}  ${r.name}`);
      console.log(`  Ticket status:   NO ticketId assigned (${r.ticketId ?? 'none'})`);
      console.log(`  Order ID:        ${r.orderId ?? '—'}`);
      console.log(`  Payment ID:      ${r.paymentId}`);
      console.log(`  Amount:          ₹${r.feeRupees ?? 0}`);
      console.log(`  Entry type:      ${r.entryType ?? 'paid'}`);
      console.log(`  Email:           ${r.email}`);
      console.log(`  Phone:           ${r.phone ?? '—'}`);
      console.log(`  Registration ID: ${r.id}`);
      console.log(`  Created:         ${created}`);
    });

    const total = withPaymentId.reduce((s, r) => s + (r.feeRupees ?? 0), 0);
    console.log(`\n====================================================`);
    console.log(`  Total potentially stuck amount: ₹${total}`);
    console.log(`  Count:                           ${withPaymentId.length}`);
    console.log('====================================================\n');
    console.log('ACTION: Check each payment_id in your Razorpay Dashboard → Payments.');
    console.log('If the payment status there is "Captured", click "Confirm + Mail" in the');
    console.log('admin table for that row to allocate ticket and send confirmation.');
    console.log();
  } else {
    console.log('No pending rows have a Razorpay paymentId stored.');
    console.log('→ No users appear to have completed Razorpay payment and got stuck.\n');
  }

  console.log('Summary:');
  console.log(`  - ${withPaymentId.length} pending rows HAVE paymentId → verify on Razorpay Dashboard, then Confirm+Mail if captured`);
  console.log(`  - ${noPaymentId.length} pending rows have NO paymentId → these are abandoned (user closed checkout, network failed mid-flow, etc.)`);
  console.log();
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});

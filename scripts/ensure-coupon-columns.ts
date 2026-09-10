import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const sql = neon(url);

  await sql`
    ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS original_fee_rupees integer
  `;
  await sql`
    ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS coupon_code text
  `;

  console.log('registrations coupon columns ready');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

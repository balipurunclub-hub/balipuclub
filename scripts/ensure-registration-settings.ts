import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS registration_settings (
      id text PRIMARY KEY,
      is_open boolean NOT NULL DEFAULT false,
      scheduled_unlock_applied boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    ALTER TABLE registration_settings
    ADD COLUMN IF NOT EXISTS scheduled_unlock_applied boolean NOT NULL DEFAULT false
  `;

  await sql`
    INSERT INTO registration_settings (id, is_open, scheduled_unlock_applied, updated_at)
    VALUES ('balipu-x-aloysius', false, false, now())
    ON CONFLICT (id) DO NOTHING
  `;

  const rows = await sql`SELECT * FROM registration_settings`;
  console.log('registration_settings ready:', rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

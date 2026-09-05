import { config } from 'dotenv';
config({ path: '.env.local' });

import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import {
  generateRandomPassword,
  hashPassword,
  hashUsername,
} from '../lib/auth';

const ADMIN_USERNAME = 'balipurunclub@gmail.com';

async function ensureSecretsInEnvLocal() {
  const fs = await import('fs');
  const path = await import('path');
  const envPath = path.join(process.cwd(), '.env.local');
  let contents = '';
  try {
    contents = fs.readFileSync(envPath, 'utf8');
  } catch {
    contents = '';
  }

  let changed = false;
  let sessionSecret = process.env.SESSION_SECRET;
  let authPepper = process.env.AUTH_PEPPER;

  if (!sessionSecret) {
    sessionSecret = randomBytes(32).toString('hex');
    contents += `\nSESSION_SECRET=${sessionSecret}\n`;
    process.env.SESSION_SECRET = sessionSecret;
    changed = true;
  }
  if (!authPepper) {
    authPepper = randomBytes(32).toString('hex');
    contents += `AUTH_PEPPER=${authPepper}\n`;
    process.env.AUTH_PEPPER = authPepper;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(envPath, contents.trim() + '\n', 'utf8');
    console.log('Wrote SESSION_SECRET / AUTH_PEPPER to .env.local');
  }
}

async function main() {
  await ensureSecretsInEnvLocal();

  const password = generateRandomPassword(14);
  const usernameHash = hashUsername(ADMIN_USERNAME);
  const passwordHash = await hashPassword(password);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.usernameHash, usernameHash))
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({ passwordHash, role: 'admin' })
      .where(eq(users.usernameHash, usernameHash));
    console.log('Updated existing admin user password.');
  } else {
    // Clear legacy rows that used old email column schema if any leftover admin roles
    await db.insert(users).values({
      usernameHash,
      passwordHash,
      role: 'admin',
    });
    console.log('Created admin user.');
  }

  console.log('');
  console.log('=== ADMIN CREDENTIALS (save these) ===');
  console.log(`Username: ${ADMIN_USERNAME}`);
  console.log(`Password: ${password}`);
  console.log('======================================');
  console.log('');
  console.log(
    `DB stores hashes only. usernameHash=${createHash('sha256').update('redacted').digest('hex').slice(0, 8)}…`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

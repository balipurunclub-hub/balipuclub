import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // Used for HMR-safe singleton in Node / Next
  // eslint-disable-next-line no-var
  var __balipuDb: DbClient | undefined;
}

function createDb(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add your Neon connection string to .env.local');
  }
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export const db = new Proxy({} as DbClient, {
  get(_target, prop, receiver) {
    if (!globalThis.__balipuDb) {
      globalThis.__balipuDb = createDb();
    }
    return Reflect.get(globalThis.__balipuDb, prop, receiver);
  },
});

export type Db = DbClient;

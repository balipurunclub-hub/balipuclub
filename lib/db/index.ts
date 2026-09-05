import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __balipuDb: DbClient | undefined;
}

function createDb(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add your Neon connection string to .env.local');
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
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

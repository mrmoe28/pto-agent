import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set. Database operations will fail.');
  }
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

let _db: ReturnType<typeof getDb> | undefined;

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    if (!_db) _db = getDb();
    return Reflect.get(_db, prop);
  },
});

export * from './schema';

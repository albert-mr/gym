import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as raw from './schema/raw';
import * as app from './schema/app';

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL (or DATABASE_URL) must be set for apps/web Drizzle client.');
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema: { ...raw, ...app } });

export { raw, app };

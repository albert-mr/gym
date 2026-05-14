import 'dotenv/config';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: 'apps/web/.env.local' });

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error('No Postgres connection string found. Set POSTGRES_URL_NON_POOLING in apps/web/.env.local.');
}

export default defineConfig({
  schema: './apps/web/lib/db/schema/*.ts',
  out: './apps/web/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  schemaFilter: ['raw', 'app'],
  verbose: true,
  strict: true,
});

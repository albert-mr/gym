// Shared helpers for migrate/*.mjs backfill scripts.
//
// All scripts must be safe to re-run (idempotent). They use postgres.js directly
// (not Drizzle) so the SQL is explicit and easy to audit.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Walk up from .../benchmarks/pm-bench/scripts/migrate to repo root, then resolve.
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
export const PM_BENCH_ROOT = path.resolve(__dirname, '..', '..');
export const MARKETS_DIR = path.join(PM_BENCH_ROOT, 'data', 'markets');
export const DASHBOARD_LATEST_JSON = path.join(REPO_ROOT, 'data', 'pm-bench', 'latest.json');

// Load .env.local from apps/web (Vercel-managed) for Postgres credentials.
import { config } from 'dotenv';
config({ path: path.join(REPO_ROOT, 'apps', 'web', '.env.local') });

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;
if (!url) {
  console.error('No Postgres connection string found. Run `vercel env pull apps/web/.env.local`.');
  process.exit(1);
}

export const sql = postgres(url, { max: 4, prepare: false, idle_timeout: 5 });

export function listDateDirs() {
  if (!fs.existsSync(MARKETS_DIR)) return [];
  return fs.readdirSync(MARKETS_DIR)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
}

export function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

export function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function ensurePoll(date, scriptVersion = 'backfill-v1') {
  const existing = await sql`
    select id from raw.polls
    where poll_date = ${date} and script_version = ${scriptVersion}
    limit 1
  `;
  if (existing.length) return existing[0].id;
  const inserted = await sql`
    insert into raw.polls (poll_date, finished_at, script_version)
    values (${date}, now(), ${scriptVersion})
    returning id
  `;
  return inserted[0].id;
}

export function log(stage, counts) {
  const parts = Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`[${stage}] ${parts}`);
}

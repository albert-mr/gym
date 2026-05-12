import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silence "inferred workspace root" warning: tell Next this is the project
  // root for tracing, since we live inside a pnpm monorepo.
  outputFileTracingRoot: resolve(__dirname, '../..'),
  // The data JSON files live outside apps/web in the monorepo data/ folder.
  // We read them at build time via fs in server components, so no special config needed.
  async redirects() {
    return [
      // /benchmarks/ was the index route; / is the index now. Keep links alive.
      { source: '/benchmarks', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;

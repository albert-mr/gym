/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The data JSON files live outside apps/web in the monorepo data/ folder.
  // We read them at build time via fs in server components, so no special config needed.
};

export default nextConfig;

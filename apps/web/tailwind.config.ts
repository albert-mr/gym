import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ink: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 400: '#94a3b8', 500: '#64748b', 700: '#334155', 900: '#0f172a' },
        // Bucket palette — keep in sync with build-data-json.mjs BUCKET_COLORS
        bucket: {
          render: '#86efac',
          alt: '#a7f3d0',
          api: '#bbf7d0',
          liquipedia: '#d9f99d',
          bo3: '#fef08a',
          flashscore: '#bef264',
          wiki: '#a3e635',
          yahoo: '#fdba74',
          hard: '#f87171',
          subjective: '#c4b5fd',
          misc: '#cbd5e1',
        },
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1280px' } },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        border: 'oklch(0.922 0 0)',
        input: 'oklch(0.922 0 0)',
        ring: 'oklch(0.708 0 0)',
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.145 0 0)',
        primary: { DEFAULT: 'oklch(0.205 0 0)', foreground: 'oklch(0.985 0 0)' },
        secondary: { DEFAULT: 'oklch(0.97 0 0)', foreground: 'oklch(0.205 0 0)' },
        muted: { DEFAULT: 'oklch(0.97 0 0)', foreground: 'oklch(0.45 0 0)' },
        accent: { DEFAULT: 'oklch(0.97 0 0)', foreground: 'oklch(0.205 0 0)' },
        destructive: { DEFAULT: 'oklch(0.577 0.245 27.325)', foreground: 'oklch(0.985 0 0)' },
        card: { DEFAULT: 'oklch(1 0 0)', foreground: 'oklch(0.145 0 0)' },
        popover: { DEFAULT: 'oklch(1 0 0)', foreground: 'oklch(0.145 0 0)' },
        // Bucket palette — keep in sync with build-data-json.mjs BUCKET_COLORS
        bucket: {
          render: '#16a34a',
          alt: '#10b981',
          api: '#059669',
          liquipedia: '#65a30d',
          bo3: '#ca8a04',
          flashscore: '#84cc16',
          wiki: '#4d7c0f',
          yahoo: '#ea580c',
          hard: '#dc2626',
          subjective: '#7c3aed',
          misc: '#64748b',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;

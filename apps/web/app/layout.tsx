import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'GenLayer Gym — where we measure what GenLayer can do',
  description: 'Open benchmarks for the GenLayer ecosystem. Polymarket, sources, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="antialiased">
        <header className="border-b border-border bg-background">
          <div className="mx-auto max-w-5xl px-6 h-14 flex items-center">
            <Link href="/" className="font-semibold tracking-tight">
              GenLayer Gym
            </Link>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem-5rem)]">{children}</main>
        <footer className="border-t border-border bg-background mt-24">
          <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted-foreground flex justify-center gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/genlayer-foundation" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <span aria-hidden="true">·</span>
            <span>GenLayer Foundation</span>
            <span aria-hidden="true">·</span>
            <span>MIT</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

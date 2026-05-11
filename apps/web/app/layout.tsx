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
          <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-semibold tracking-tight">GenLayer Gym</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">where we measure what GenLayer can do</span>
            </Link>
            <nav className="flex gap-7 text-sm text-muted-foreground">
              <Link className="hover:text-foreground transition-colors" href="/benchmarks">Benchmarks</Link>
              <Link className="hover:text-foreground transition-colors" href="/about">About</Link>
              <a className="hover:text-foreground transition-colors" href="https://github.com/genlayer-foundation" target="_blank" rel="noopener noreferrer">GitHub</a>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem-5rem)]">{children}</main>
        <footer className="border-t border-border bg-background mt-24">
          <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted-foreground flex justify-between">
            <div>GenLayer Gym · Open source · GenLayer Foundation · MIT</div>
            <div>Every number traces to a committed file.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}

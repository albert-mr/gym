import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'gym — GenLayer intelligent oracle benchmarks',
  description: 'Open-source benchmarks for GenLayer\'s intelligent oracle. Polymarket routability, source accessibility, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-ink-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-mono font-semibold text-ink-900 tracking-tight">gym <span className="text-ink-400">·</span> <span className="text-ink-500 font-normal">genlayer benchmarks</span></Link>
            <nav className="flex gap-6 text-sm">
              <Link className="text-ink-700 hover:text-ink-900" href="/benchmarks">Benchmarks</Link>
              <Link className="text-ink-700 hover:text-ink-900" href="/about">About</Link>
              <a className="text-ink-700 hover:text-ink-900" href="https://github.com/genlayer-foundation" target="_blank" rel="noopener noreferrer">GitHub</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-ink-200 bg-white mt-24">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-500 flex justify-between">
            <div>gym · GenLayer Foundation · open source</div>
            <div>Data updated daily · static site</div>
          </div>
        </footer>
      </body>
    </html>
  );
}

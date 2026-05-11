import Link from 'next/link';
import { loadComingSoon } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

export default function SourcesBenchPage() {
  const data = loadComingSoon('sources-bench');
  if (!data) return <div className="mx-auto max-w-2xl px-6 py-12 text-muted-foreground">No upcoming benchmark data found.</div>;
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
      <div>
        <Link href="/benchmarks" className="text-sm text-muted-foreground hover:text-foreground">← Benchmarks</Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest">Planned</Badge>
          <span className="font-mono text-xs text-muted-foreground">{data.name}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Source accessibility</h1>
      </header>

      <section>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{data.description}</p>
      </section>

      <section className="border-l-2 border-foreground/30 pl-4 py-2 text-sm text-muted-foreground leading-relaxed">
        This benchmark is in the design phase. The plan and stub data live in the repo. This page will publish results after the first probe dataset is collected.
      </section>

      {data.link && (
        <div>
          <a href={data.link} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>View the plan on GitHub →</a>
        </div>
      )}
    </div>
  );
}

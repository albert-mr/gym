'use client';
import { useMemo, useState } from 'react';
import type { BenchmarkData, Template, MarketRow } from '../lib/types';
import { SOLVED_BUCKETS } from '../lib/types';
import { BucketBadge } from './BucketBadge';

type Props = { data: BenchmarkData };

export function DrilldownTree({ data }: Props) {
  const [date, setDate] = useState<string>('');
  const [bucket, setBucket] = useState<string>('');
  const [solvedOnly, setSolvedOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.templates.filter(t => {
      if (date && !t.dates.includes(date)) return false;
      if (bucket && t.dominantBucket !== bucket) return false;
      if (solvedOnly && !SOLVED_BUCKETS.has(t.dominantBucket)) return false;
      if (q) {
        const hay = `${t.template} ${t.example.question} ${t.example.eRSHost} ${t.example.rebindHost} ${t.L1} ${t.L2} ${t.L3}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.templates, date, bucket, solvedOnly, search]);

  const nested = useMemo(() => nest(filtered), [filtered]);

  const toggleExpanded = (tplId: string) => {
    const next = new Set(expanded);
    if (next.has(tplId)) next.delete(tplId); else next.add(tplId);
    setExpanded(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4 p-3 bg-ink-50 rounded text-xs">
        <label className="flex items-center gap-1.5 text-ink-500">Date
          <select className="border border-ink-200 rounded px-1.5 py-1 text-sm font-mono" value={date} onChange={e => setDate(e.target.value)}>
            <option value="">all</option>
            {data.meta.dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-ink-500">Bucket
          <select className="border border-ink-200 rounded px-1.5 py-1 text-sm" value={bucket} onChange={e => setBucket(e.target.value)}>
            <option value="">all</option>
            {Object.entries(data.bucketLabels).map(([b, l]) => <option key={b} value={b}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-ink-500">
          <input type="checkbox" checked={solvedOnly} onChange={e => setSolvedOnly(e.target.checked)} /> Solved only
        </label>
        <label className="flex items-center gap-1.5 text-ink-500 flex-1">Search
          <input
            type="text"
            placeholder="question / template / host"
            className="flex-1 border border-ink-200 rounded px-2 py-1 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <button className="px-3 py-1 border border-ink-200 rounded bg-white text-sm hover:bg-ink-50" onClick={() => { setDate(''); setBucket(''); setSolvedOnly(false); setSearch(''); }}>Reset</button>
      </div>

      {filtered.length === 0 && (
        <div className="text-ink-500 italic py-6 text-center">No templates match these filters.</div>
      )}

      <div className="space-y-2">
        {[...nested.entries()].sort((a, b) => sumMap(b[1]) - sumMap(a[1])).map(([L1, m1]) => (
          <details key={L1} open className="text-sm">
            <summary className="cursor-pointer font-semibold py-1">{L1} <span className="text-ink-400 font-normal">({sumMap(m1).toLocaleString()} markets)</span></summary>
            {[...m1.entries()].sort((a, b) => sumMap(b[1]) - sumMap(a[1])).map(([L2, m2]) => (
              <details key={L2} className="ml-4">
                <summary className="cursor-pointer py-1 text-ink-700">{L2} <span className="text-ink-400 text-xs">({sumMap(m2).toLocaleString()})</span></summary>
                {[...m2.entries()].sort((a, b) => sumArr(b[1]) - sumArr(a[1])).map(([L3, tpls]) => (
                  <details key={L3} className="ml-4">
                    <summary className="cursor-pointer py-1 text-ink-500">{L3} <span className="text-ink-400 text-xs">({sumArr(tpls).toLocaleString()} markets · {tpls.length} templates)</span></summary>
                    <div className="ml-4 space-y-2 mt-2">
                      {tpls.map(t => (
                        <TemplateCard key={t.id} t={t} data={data} expanded={expanded.has(t.id)} onToggle={() => toggleExpanded(t.id)} />
                      ))}
                    </div>
                  </details>
                ))}
              </details>
            ))}
          </details>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ t, data, expanded, onToggle }: { t: Template; data: BenchmarkData; expanded: boolean; onToggle: () => void }) {
  const ex = t.example;
  const winnerClass = ex.winner === 'pending' ? 'text-ink-400 italic' :
    (ex.winner === 'Yes' || ex.winner === 'Up' || ex.winner === 'Over') ? 'text-green-700 font-semibold' :
    'text-red-700 font-semibold';
  const borderColor = data.bucketColors[t.dominantBucket] ?? '#cbd5e1';
  const markets = data.marketsByTemplate[t.id] ?? [];
  return (
    <div className="rounded-r bg-ink-50 px-3 py-2 border-l-4" style={{ borderLeftColor: borderColor }}>
      <div className="flex flex-wrap gap-2 items-center">
        <code className="font-mono text-[12.5px] flex-1 min-w-[250px]">{t.template}</code>
        <BucketBadge bucket={t.dominantBucket} label={data.bucketLabels[t.dominantBucket] ?? t.dominantBucket} color={data.bucketColors[t.dominantBucket]} />
        <span className="text-[11px] text-ink-500">{t.count.toLocaleString()} markets · {t.dates.length} day{t.dates.length===1?'':'s'} · hosts: {t.eRSHosts.slice(0,2).join(', ')}{t.eRSHosts.length>2 ? ` +${t.eRSHosts.length-2}` : ''}</span>
      </div>
      <div className="mt-1.5 pl-2 border-l-2 border-ink-200 text-[12.5px] text-ink-500">
        Example [{ex.date}]: <strong className="text-ink-900 font-normal">{ex.question}</strong>
        {' · '}eRS <code className="bg-ink-100 px-1 rounded text-[11px]">{ex.eRS}</code>
        {ex.rebindHost && ex.rebindHost !== ex.eRSHost && (<><>→ fetch <code className="bg-ink-100 px-1 rounded text-[11px]">{ex.rebindHost}</code></></>)}
        {' · '}winner <span className={winnerClass}>{ex.winner}</span>
        {ex.eventSlug && (<>{' · '}<a className="text-blue-600 hover:underline" href={`https://polymarket.com/event/${ex.eventSlug}`} target="_blank" rel="noopener noreferrer">Verify on Polymarket</a></>)}
      </div>
      <button className="mt-1 text-[11px] text-blue-600 hover:underline" onClick={onToggle}>
        {expanded ? 'hide all' : `show all ${t.count} markets`}
      </button>
      {expanded && (
        <div className="mt-2 pl-2 max-h-72 overflow-y-auto">
          <table className="w-full text-[11.5px]">
            <tbody>
              {markets.map((m: MarketRow) => {
                const w = m.winner === 'pending' ? 'text-ink-400 italic' :
                  (m.winner === 'Yes' || m.winner === 'Up' || m.winner === 'Over') ? 'text-green-700 font-semibold' :
                  'text-red-700 font-semibold';
                return (
                  <tr key={m.id}>
                    <td className="py-0.5 px-1 border-b border-dotted border-ink-200">{m.date}</td>
                    <td className="py-0.5 px-1 border-b border-dotted border-ink-200">{m.question}</td>
                    <td className="py-0.5 px-1 border-b border-dotted border-ink-200"><code className="text-[10px]">{m.eRSHost}</code></td>
                    <td className={`py-0.5 px-1 border-b border-dotted border-ink-200 ${w}`}>{m.winner}</td>
                    <td className="py-0.5 px-1 border-b border-dotted border-ink-200">
                      {m.slug && <a className="text-blue-600 hover:underline" href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer">link</a>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function nest(templates: Template[]): Map<string, Map<string, Map<string, Template[]>>> {
  const root = new Map<string, Map<string, Map<string, Template[]>>>();
  for (const t of templates) {
    if (!root.has(t.L1)) root.set(t.L1, new Map());
    const m1 = root.get(t.L1)!;
    if (!m1.has(t.L2)) m1.set(t.L2, new Map());
    const m2 = m1.get(t.L2)!;
    if (!m2.has(t.L3)) m2.set(t.L3, []);
    m2.get(t.L3)!.push(t);
  }
  return root;
}

function sumMap(m: Map<string, unknown>): number {
  let n = 0;
  for (const v of m.values()) {
    if (v instanceof Map) n += sumMap(v as Map<string, unknown>);
    else if (Array.isArray(v)) n += sumArr(v as Template[]);
  }
  return n;
}
function sumArr(arr: Template[]): number { return arr.reduce((s, t) => s + t.count, 0); }

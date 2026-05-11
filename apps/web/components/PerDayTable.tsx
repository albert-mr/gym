import type { BenchmarkData } from '../lib/types';
import { num, pct } from '../lib/format';

export function PerDayTable({ data }: { data: BenchmarkData }) {
  const dates = data.meta.dates;
  let tPass = 0, tDeep = 0, tShlw = 0, tAlt = 0, tUns = 0, tRes = 0;
  for (const d of dates) {
    const p = data.perDay[d];
    if (!p) continue;
    tPass += p.gate1Pass; tDeep += p.directDeep; tShlw += p.directShallow;
    tAlt += p.alt; tUns += p.unsolvable; tRes += p.resolved;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-ink-100">
            <th className="text-left p-2 border-b border-ink-200 font-semibold">Date</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold">Addressable</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold" title="Same host as eRS (deep URL OR homepage works)">Direct</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold" title="eRS URL has path with 2+ segments; fetched as-is">— eRS as-is</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold" title="eRS is homepage; we navigate to deeper URL OR homepage works">— same host, deeper</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold" title="Rerouted to different host (LaLiga→ESPN, HLTV→Liquipedia)">Alt</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold" title="Hard tail, Yahoo, subjective, misc">Unsolvable</th>
            <th className="text-right p-2 border-b border-ink-200 font-semibold" title="Polymarket has resolved (outcomePrices = [1,0] or [0,1])">Resolved</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {dates.map(d => {
            const p = data.perDay[d];
            if (!p) return null;
            const direct = p.directDeep + p.directShallow;
            return (
              <tr key={d} className="hover:bg-ink-50">
                <td className="p-2 border-b border-ink-200 font-sans">{d}</td>
                <td className="p-2 border-b border-ink-200 text-right">{num(p.gate1Pass)}</td>
                <td className="p-2 border-b border-ink-200 text-right font-semibold">{num(direct)} <span className="text-ink-400 text-xs">({pct(direct, p.gate1Pass)})</span></td>
                <td className="p-2 border-b border-ink-200 text-right text-ink-500">{num(p.directDeep)}</td>
                <td className="p-2 border-b border-ink-200 text-right text-ink-500">{num(p.directShallow)}</td>
                <td className="p-2 border-b border-ink-200 text-right">{num(p.alt)} <span className="text-ink-400 text-xs">({pct(p.alt, p.gate1Pass)})</span></td>
                <td className="p-2 border-b border-ink-200 text-right">{num(p.unsolvable)} <span className="text-ink-400 text-xs">({pct(p.unsolvable, p.gate1Pass)})</span></td>
                <td className="p-2 border-b border-ink-200 text-right text-ink-500">{num(p.resolved)}</td>
              </tr>
            );
          })}
          <tr className="bg-indigo-50 font-semibold">
            <td className="p-2 border-t-2 border-ink-700 font-sans">Total</td>
            <td className="p-2 border-t-2 border-ink-700 text-right">{num(tPass)}</td>
            <td className="p-2 border-t-2 border-ink-700 text-right">{num(tDeep + tShlw)} <span className="text-ink-400 text-xs">({pct(tDeep+tShlw, tPass)})</span></td>
            <td className="p-2 border-t-2 border-ink-700 text-right text-ink-500">{num(tDeep)}</td>
            <td className="p-2 border-t-2 border-ink-700 text-right text-ink-500">{num(tShlw)}</td>
            <td className="p-2 border-t-2 border-ink-700 text-right">{num(tAlt)} <span className="text-ink-400 text-xs">({pct(tAlt, tPass)})</span></td>
            <td className="p-2 border-t-2 border-ink-700 text-right">{num(tUns)} <span className="text-ink-400 text-xs">({pct(tUns, tPass)})</span></td>
            <td className="p-2 border-t-2 border-ink-700 text-right text-ink-500">{num(tRes)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

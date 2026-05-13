import Link from 'next/link';
import type { BenchmarkData, ExplorerCircle, ExplorerMarketRow } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CIRCLE_META, CIRCLE_ORDER, rowCount } from '@/lib/explorer-data';
import { num, pct } from '@/lib/format';

type DayRow = {
  date: string;
  label: string;
  rows: ExplorerMarketRow[];
  circles: Record<ExplorerCircle, number>;
  total: number;
};

export function PerDayTable({ data, rows }: { data: BenchmarkData; rows: ExplorerMarketRow[] }) {
  const dayRows = buildDayRows(data, rows);
  const totals = sumDayRows(dayRows);

  if (dayRows.length === 0) {
    return <div className="text-muted-foreground italic py-12 text-center text-sm">No days match these filters.</div>;
  }

  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs text-right">Markets</TableHead>
            <TableHead className="text-xs text-right">Chainlink</TableHead>
            <TableHead className="text-xs text-right">Pyth</TableHead>
            <TableHead className="text-xs text-right">Direct source</TableHead>
            <TableHead className="text-xs text-right">Alternative source</TableHead>
            <TableHead className="text-xs text-right">Held / unresolvable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {dayRows.map(day => (
            <TableRow key={day.date || 'aggregate'}>
            <TableCell className="font-medium">
              {day.date ? (
                <Link href={`/benchmarks/polymarket/explorer?view=list&date=${day.date}`} className="hover:text-foreground underline-offset-4 hover:underline">{day.label}</Link>
              ) : day.label}
            </TableCell>
              <TableCell className="text-right font-medium">
                {day.date ? (
                  <Link href={`/benchmarks/polymarket/explorer?view=list&date=${day.date}`} className="hover:text-foreground underline-offset-4 hover:underline">{num(day.total)}</Link>
                ) : num(day.total)}
              </TableCell>
              {CIRCLE_ORDER.map(circle => (
                <TableCell key={circle} className="text-right">
                  {circleCell(day, circle)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className="bg-muted/40 font-medium border-t-2 border-foreground/20">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">
              <Link href="/benchmarks/polymarket/explorer?view=list" className="hover:text-foreground underline-offset-4 hover:underline">{num(totals.total)}</Link>
            </TableCell>
            {CIRCLE_ORDER.map(circle => (
              <TableCell key={circle} className="text-right">
                {num(totals.circles[circle])} <span className="text-muted-foreground text-xs">({pct(totals.circles[circle], totals.total)})</span>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function buildDayRows(data: BenchmarkData, rows: ExplorerMarketRow[]): DayRow[] {
  const byDate = new Map<string, ExplorerMarketRow[]>();
  for (const row of rows) {
    const key = row.date || '';
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(row);
  }

  const out: DayRow[] = [];
  for (const date of data.meta.dates) {
    const dayRows = byDate.get(date) ?? [];
    if (dayRows.length === 0) continue;
    out.push(makeDayRow(date, date, dayRows));
  }
  const aggregateRows = byDate.get('') ?? [];
  if (aggregateRows.length) out.push(makeDayRow('', 'all dates aggregate', aggregateRows));
  return out;
}

function makeDayRow(date: string, label: string, rows: ExplorerMarketRow[]): DayRow {
  const circles: Record<ExplorerCircle, number> = { chainlink: 0, pyth: 0, direct: 0, alternative: 0, held: 0 };
  for (const row of rows) circles[row.circle] += row.count;
  return { date, label, rows, circles, total: rowCount(rows) };
}

function sumDayRows(rows: DayRow[]) {
  const circles: Record<ExplorerCircle, number> = { chainlink: 0, pyth: 0, direct: 0, alternative: 0, held: 0 };
  let total = 0;
  for (const row of rows) {
    total += row.total;
    for (const circle of CIRCLE_ORDER) circles[circle] += row.circles[circle];
  }
  return { total, circles };
}

function circleCell(day: DayRow, circle: ExplorerCircle) {
  const count = day.circles[circle];
  if (!count) return <span className="text-muted-foreground/60">0</span>;
  const content = (
    <>
      <span style={{ color: CIRCLE_META[circle].color }}>{num(count)}</span>{' '}
      <span className="text-muted-foreground text-xs">({pct(count, day.total)})</span>
    </>
  );
  if (!day.date) return content;
  return (
    <Link href={`/benchmarks/polymarket/explorer?view=list&date=${day.date}&circle=${circle}`} className="hover:text-foreground underline-offset-4 hover:underline">
      {content}
    </Link>
  );
}

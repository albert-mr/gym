import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

type Props = {
  data: BenchmarkData;
};

// Simplified Sankey: top N source hosts on the left, three buckets on the
// right (Direct / Alternative / Unresolvable). Link width = market count.
// Inline SVG, no library. Top hosts only — the long tail is grouped as "other".
export function SankeySourcesChart({ data }: Props) {
  const topN = 8;
  const hosts = [...data.domains].sort((a, b) => b.count - a.count);
  const top = hosts.slice(0, topN);
  const rest = hosts.slice(topN);
  const restCount = rest.reduce((s, h) => s + h.count, 0);
  const left = [
    ...top.map(h => ({ name: h.host, count: h.count, buckets: h.buckets })),
    ...(restCount > 0 ? [{ name: `+${rest.length} other hosts`, count: restCount, buckets: rest.reduce<Record<string, number>>((acc, h) => {
      for (const [k, v] of Object.entries(h.buckets)) acc[k] = (acc[k] ?? 0) + v;
      return acc;
    }, {}) }] : []),
  ];

  const bucketFor = (b: string): 'direct' | 'alt' | 'unresolvable' => {
    if (DIRECT_BUCKETS.has(b)) return 'direct';
    if (ALT_BUCKETS.has(b)) return 'alt';
    return 'unresolvable';
  };
  const rightTotals = { direct: 0, alt: 0, unresolvable: 0 };
  for (const node of left) {
    for (const [b, n] of Object.entries(node.buckets)) rightTotals[bucketFor(b)] += n;
  }
  const grandTotal = Math.max(1, rightTotals.direct + rightTotals.alt + rightTotals.unresolvable);

  const width = 640;
  const height = Math.max(220, left.length * 28);
  const leftX = 0;
  const rightX = width - 160;
  const colW = 160;
  const linkW = rightX - colW;

  const leftYs: number[] = [];
  let y = 0;
  const gap = 4;
  const totalLeft = left.reduce((s, n) => s + n.count, 0) || 1;
  const leftScale = (height - left.length * gap) / totalLeft;
  for (const node of left) {
    leftYs.push(y);
    y += node.count * leftScale + gap;
  }

  const rightOrder: Array<'direct' | 'alt' | 'unresolvable'> = ['direct', 'alt', 'unresolvable'];
  const rightYs: Record<string, number> = {};
  let ry = 0;
  const rightScale = (height - rightOrder.length * gap) / grandTotal;
  for (const k of rightOrder) {
    rightYs[k] = ry;
    ry += rightTotals[k] * rightScale + gap;
  }

  const colorFor = (k: string) => k === 'direct' ? '#16a34a' : k === 'alt' ? '#65a30d' : '#94a3b8';
  const rightUsed = { direct: 0, alt: 0, unresolvable: 0 };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 20}`} width="100%" height={height + 20} aria-label="Source family to bucket routing">
        {left.map((node, i) => {
          const ny = leftYs[i];
          const nh = node.count * leftScale;
          return (
            <g key={node.name}>
              <rect x={leftX} y={ny} width={colW} height={nh} fill="#e2e8f0" />
              <text x={leftX + colW - 6} y={ny + nh / 2} textAnchor="end" alignmentBaseline="middle" fontSize="11" fill="#0f172a">
                {node.name} ({node.count.toLocaleString()})
              </text>
            </g>
          );
        })}

        {rightOrder.map(k => {
          const ry = rightYs[k];
          const rh = rightTotals[k] * rightScale;
          return (
            <g key={k}>
              <rect x={rightX} y={ry} width={colW} height={rh} fill={colorFor(k)} />
              <text x={rightX + 6} y={ry + rh / 2} textAnchor="start" alignmentBaseline="middle" fontSize="11" fill="white">
                {k} ({rightTotals[k].toLocaleString()})
              </text>
            </g>
          );
        })}

        {left.flatMap((node, i) => {
          let nodeAcc = 0;
          return Object.entries(node.buckets).map(([b, n]) => {
            const bk = bucketFor(b);
            const x0 = leftX + colW;
            const y0 = leftYs[i] + nodeAcc * leftScale;
            const yh = n * leftScale;
            const x1 = rightX;
            const y1 = rightYs[bk] + rightUsed[bk] * rightScale;
            const yh2 = n * rightScale;
            nodeAcc += n;
            rightUsed[bk] += n;
            const mid = (x0 + x1) / 2;
            const d = `M ${x0} ${y0} C ${mid} ${y0}, ${mid} ${y1}, ${x1} ${y1} L ${x1} ${y1 + yh2} C ${mid} ${y1 + yh2}, ${mid} ${y0 + yh}, ${x0} ${y0 + yh} Z`;
            return <path key={`${node.name}-${b}`} d={d} fill={colorFor(bk)} fillOpacity={0.35} />;
          });
        })}
      </svg>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Top {topN} source hosts on the left routed to bucket on the right. Width = market count. The long tail is grouped as &ldquo;other&rdquo;.</p>
    </div>
  );
}

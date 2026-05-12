import type { DomainRow } from './types';

// Buckets where the binding host renders directly (host is the working source).
const DIRECT_BUCKETS = new Set(['render', 'alt', 'api']);

// Buckets where the binding host is blocked/unreliable but a working alternative exists.
// rebind on the row points at the working host.
const ALT_PATH_BUCKETS = new Set([
  'liquipedia_recover',
  'bo3_recover',
  'frmf_via_flashscore',
  'eurovision_via_wiki',
]);

// Buckets where the host is not reachable and we have no known alternative.
const FAILURE_REASONS: Record<string, string> = {
  yahoo: 'Soft paywall — public URL gates behind login.',
  hard: 'Blocked or walled to validator infrastructure.',
  studio_blocked: "Studio's web.render receives HTTP 403.",
  hltv_lost: 'No alternative path contains the resolution data.',
  subjective: 'No canonical web source; needs consensus reporting.',
  no_source: 'No URL declared.',
  misc: 'Not yet probed.',
};

// Reasons for buckets where the host is blocked but an alternative exists.
const ALT_PATH_REASONS: Record<string, string> = {
  liquipedia_recover: "Host doesn't render reliably; data aggregated on Liquipedia.",
  bo3_recover: "Host doesn't render reliably; data on bo3.gg.",
  frmf_via_flashscore: 'Validator IPs blocked from the official federation site.',
  eurovision_via_wiki: 'Cloudflare-walled; full event data on Wikipedia.',
};

// Polymarket-side placeholder for "no URL declared in resolution criteria".
const SYNTHETIC_HOST = '(none)';

// Working alternatives that are referenced as `rebind` targets but do not appear
// as their own row in pm-bench.domains[]. We surface them as accessible rows so
// the table is the single source of truth for "what works".
type Synthetic = { source: string; category: string; markets: number };
const SYNTHETIC_ACCESSIBLE: Synthetic[] = [
  // Studio-verified 2026-05-09 as alt for frmf.ma per cross-day-classify.mjs:84.
  { source: 'www.flashscore.com', category: 'Sports', markets: 0 },
];

export type SourceRow = {
  source: string;
  accessible: boolean;
  reason?: string;
  alternative?: string;
  category: string;
  markets: number;
};

export type SourcesTable = {
  rows: SourceRow[];
  generatedAt: string;
  accessibleCount: number;
  inaccessibleCount: number;
  total: number;
};

function isRealHost(host: string | undefined | null): host is string {
  return !!host && host !== SYNTHETIC_HOST;
}

export function buildSourcesTable(
  domains: DomainRow[],
  generatedAt: string,
): SourcesTable {
  const rows: SourceRow[] = [];
  const seen = new Set<string>();

  function addRow(row: SourceRow) {
    const key = row.source.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  }

  for (const d of domains) {
    // Skip the synthetic "(none)" row — its data is attributed to rebind's own row.
    if (!isRealHost(d.host)) continue;

    const category = d.category || 'Other';
    const markets = d.count;

    if (DIRECT_BUCKETS.has(d.dominantBucket)) {
      addRow({ source: d.host, accessible: true, category, markets });
    } else if (ALT_PATH_BUCKETS.has(d.dominantBucket)) {
      addRow({
        source: d.host,
        accessible: false,
        reason: ALT_PATH_REASONS[d.dominantBucket] ?? 'Host not reachable.',
        alternative: d.rebind || undefined,
        category,
        markets,
      });
    } else {
      addRow({
        source: d.host,
        accessible: false,
        reason: FAILURE_REASONS[d.dominantBucket] ?? 'Not currently reachable.',
        category,
        markets,
      });
    }
  }

  // Add synthetic accessible rows for working alternatives that aren't in domains[].
  for (const s of SYNTHETIC_ACCESSIBLE) {
    addRow({ source: s.source, accessible: true, category: s.category, markets: s.markets });
  }

  // Sort: accessible first (alphabetical), then inaccessible (markets desc, then alphabetical).
  rows.sort((a, b) => {
    if (a.accessible !== b.accessible) return a.accessible ? -1 : 1;
    if (a.accessible) return a.source.localeCompare(b.source);
    if (a.markets !== b.markets) return b.markets - a.markets;
    return a.source.localeCompare(b.source);
  });

  const accessibleCount = rows.filter((r) => r.accessible).length;
  return {
    rows,
    generatedAt,
    accessibleCount,
    inaccessibleCount: rows.length - accessibleCount,
    total: rows.length,
  };
}

export function buildAgentPromptMarkdown(table: SourcesTable): string {
  const date = (table.generatedAt || '').slice(0, 10);
  const lines: string[] = [];
  lines.push('# Web sources for GenLayer intelligent contracts');
  lines.push('');
  lines.push(
    `As of ${date || 'today'}. Reachability against validator-equivalent infrastructure (web.render).`,
  );
  lines.push('');

  const accessible = table.rows.filter((r) => r.accessible);
  const withAlt = table.rows.filter((r) => !r.accessible && r.alternative);
  const noAlt = table.rows.filter((r) => !r.accessible && !r.alternative);

  lines.push('## Accessible (use these)');
  for (const r of accessible) {
    lines.push(`- \`${r.source}\` (${r.category})`);
  }
  lines.push('');

  if (withAlt.length > 0) {
    lines.push('## Not accessible — use alternative');
    for (const r of withAlt) {
      lines.push(`- \`${r.source}\` (${r.category}) → use \`${r.alternative}\``);
    }
    lines.push('');
  }

  if (noAlt.length > 0) {
    lines.push('## Not accessible — no alternative');
    for (const r of noAlt) {
      lines.push(`- \`${r.source}\` (${r.category}) — ${r.reason ?? 'Not reachable.'}`);
    }
    lines.push('');
  }

  lines.push('Source: gym.genlayer.foundation/benchmarks/sources-bench');
  return lines.join('\n');
}

export function buildJsonExport(table: SourcesTable): string {
  const sources = table.rows.map((r) => {
    const out: Record<string, unknown> = {
      source: r.source,
      accessible: r.accessible,
      category: r.category,
    };
    if (!r.accessible && r.reason) out.reason = r.reason;
    if (!r.accessible && r.alternative) out.alternative = r.alternative;
    return out;
  });
  const payload = {
    generatedAt: table.generatedAt,
    source: 'GenLayer Gym — Sources benchmark',
    url: 'https://gym.genlayer.foundation/benchmarks/sources-bench',
    count: table.total,
    accessible: table.accessibleCount,
    inaccessible: table.inaccessibleCount,
    sources,
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

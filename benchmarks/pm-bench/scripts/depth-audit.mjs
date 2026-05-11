// depth-audit.mjs — per-day breakdown using the SAME classifier as cross-day-classify.mjs,
// plus a depth split of render+api buckets to distinguish:
//   - eRS URL is itself "deep" enough (path has >=2 segments OR contains a digit)
//   - eRS URL is "shallow" (homepage / generic listing — needs deeper URL on same host)
//
// Uses the authoritative classifier from cross-day-classify.mjs so bucket counts match
// the production report exactly.

import fs from 'node:fs';
import { classifyMarket } from './cross-day-classify.mjs';

function isDeep(url) {
  try {
    const p = new URL(url).pathname || '/';
    const segs = p.split('/').filter(Boolean);
    if (segs.length >= 2) return true;
    if (segs.length === 1 && /\d/.test(segs[0])) return true;
    return false;
  } catch { return false; }
}

const days = ['2026-05-06','2026-05-07','2026-05-08','2026-05-09','2026-05-10','2026-05-11'];

console.log('date         gate1   render  rDeep  rShlw    api  aDeep  aShlw    alt    liq    bo3   frmf   euro  yahoo   hard   subj   misc');
for (const date of days) {
  const lines = fs.readFileSync(`data/markets/${date}/gate1-pass.jsonl`, 'utf-8').trim().split('\n');
  const counts = {};
  let rDeep = 0, rShlw = 0, aDeep = 0, aShlw = 0;
  for (const line of lines) {
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    const { bucket } = classifyMarket(m);
    counts[bucket] = (counts[bucket] || 0) + 1;
    if (bucket === 'render' || bucket === 'api') {
      const eRS = m.eventResolutionSource || '';
      const deep = isDeep(eRS);
      if (bucket === 'render') { deep ? rDeep++ : rShlw++; }
      else { deep ? aDeep++ : aShlw++; }
    }
  }
  const pad = (n, w) => String(n).padStart(w);
  console.log([
    date.padEnd(11),
    pad(lines.length, 5),
    pad(counts.render || 0, 8),
    pad(rDeep, 6),
    pad(rShlw, 6),
    pad(counts.api || 0, 6),
    pad(aDeep, 6),
    pad(aShlw, 6),
    pad(counts.alt || 0, 6),
    pad(counts.liquipedia_recover || 0, 6),
    pad(counts.bo3_recover || 0, 6),
    pad(counts.frmf_via_flashscore || 0, 6),
    pad(counts.eurovision_via_wiki || 0, 6),
    pad(counts.yahoo || 0, 6),
    pad(counts.hard || 0, 6),
    pad(counts.subjective || 0, 6),
    pad(counts.misc || 0, 6),
  ].join(''));
}

#!/usr/bin/env node
// Deploy IntelligentOracle contracts to GenLayer Studio for the binding-render
// validated markets. One contract per market. Resolves each, captures result.
//
// Usage:
//   node scripts/deploy-oracles.mjs              # deploy + resolve + read all 63
//   node scripts/deploy-oracles.mjs --warmup     # only the first row (Wunderground London)
//   node scripts/deploy-oracles.mjs --concurrency 5    # default 5
//   node scripts/deploy-oracles.mjs --resume     # skip rows already in studio-deploy-results.jsonl

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = '/Users/albert/conductor/workspaces/gym/beijing/benchmarks/pm-bench';
const CONTRACT = path.join(ROOT, 'contracts/intelligent_oracle.py');
const INPUT = path.join(ROOT, 'data/markets/2026-05-07/binding-render-deep-urls.jsonl');
const OUT_JSONL = path.join(ROOT, 'data/markets/2026-05-07/studio-deploy-results.jsonl');
const RPC = 'https://studio.genlayer.com/api';
const WALLET_PASSWORD = 'studio-test-2026-05-08';

// Parse args
const args = process.argv.slice(2);
const opts = {
  warmup: args.includes('--warmup'),
  resume: args.includes('--resume'),
  concurrency: 5,
};
const cIdx = args.indexOf('--concurrency');
if (cIdx >= 0) opts.concurrency = parseInt(args[cIdx + 1] || '5', 10);

// Strict-grade expected outcomes from yesterday (for compare)
const EXPECTED = {
  // Wunderground London (lowest 9°C)
  '2161570': 'No', '2161580': 'No', '2161542': 'No', '2161551': 'No',
  '2161603': 'Yes', '2161534': 'No', '2161561': 'No', '2161590': 'No',
  // Wunderground Paris (lowest 9°C, none asked exactly 9)
  '2161670': 'No', '2161671': 'No',
  // UEFA: Crystal Palace 2-1 Shakhtar (agg 5-2) — Crystal Palace wins
  '2062283': 'Yes', '2062284': 'No', '2062285': 'No',
  // UEFA: Strasbourg 0-1 Rayo (agg 0-2) — Rayo wins, market O/U totals depend on goal-count
  '2062286': 'No', '2062287': 'Yes', '2062288': 'No',
  // O/U markets: total goals = 1 → Over 0.5 only
  '2065556': 'Yes', // O/U 1.5: 1 goal → No (under). Actually re-check.
  '2065557': 'No', '2065558': 'No', '2065559': 'No',
  // Apple chart: Claude is #2
  '2167450': 'No', '2167451': 'No', '2167452': 'Yes', '2167453': 'No', '2167454': 'No',
  '2167455': 'No', '2167456': 'No', '2167457': 'No', '2167458': 'No', '2167459': 'No',
  // HK Observatory: 24°C
  '2161781': 'No', '2161780': 'No', '2161771': 'No', '2161772': 'No', '2161773': 'No',
  '2161774': 'No', '2161775': 'No', '2161776': 'No', '2161777': 'Yes', '2161778': 'No',
  // weather.gov Tel Aviv: 23°C; Moscow: 28°C (none asked exactly 28)
  '2161986': 'No', '2161987': 'Yes', '2161988': 'No', '2161989': 'No',
  '2161990': 'No', '2161991': 'No', '2161992': 'No',
  '2162195': 'No', '2162196': 'No', '2162197': 'No',
  // CDC Week 17: 86.0 → 85-90 bracket
  '2126784': 'No', '2126785': 'No', '2126786': 'Yes', '2126787': 'No', '2126788': 'No', '2126789': 'No',
  // NHL Hurricanes 4-1 Flyers (5 total goals)
  '2148546': 'Hurricanes',  // moneyline
  '2161337': 'Hurricanes',  // spread Hurricanes -1.5: won by 3, YES
  '2148547': 'Yes', // O/U 4.5: total 5 → over → YES
  '2148548': 'No',  // O/U 5.5: 5 → under → NO
  '2148550': 'No',  // O/U 6.5: 5 → under → NO
  '2148551': 'No',  // O/U 7.5: 5 → under → NO
  // Euroleague: Real Madrid won 87-81
  '2174971': 'Real Madrid',
};

// ---- helpers ----
function _runOnce(subargs, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn('genlayer', subargs, opts);
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => resolve({ code, stdout, stderr }));
    proc.stdin.write(WALLET_PASSWORD + '\n');
    proc.stdin.end();
  });
}

async function execGenlayer(subargs, opts = {}) {
  // Retry on Studio rate limits with exponential backoff (4s, 8s, 16s, 32s, 64s)
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await _runOnce(subargs, opts);
    const blob = (r.stderr || '') + (r.stdout || '');
    const isRateLimited = /Rate limit exceeded/i.test(blob);
    if (!isRateLimited) return r;
    const wait = 4000 * (2 ** attempt);
    logIt(`  rate-limited; backing off ${wait}ms (attempt ${attempt+1}/5)`);
    await new Promise(res => setTimeout(res, wait));
  }
  // Last try
  return await _runOnce(subargs, opts);
}

function logIt(...parts) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}]`, ...parts);
}

function parseTxId(stdout) {
  return parseTxHash(stdout);
}

function parseDeployedAddress(stdout) {
  // The output has "Contract Address: 0x..." in the success block
  const m = stdout.match(/Contract Address['"]?\s*[:=]\s*['"]?(0x[0-9a-fA-F]{40})/);
  if (m) return m[1];
  // Fallback: last 0x40-hex
  const matches = [...stdout.matchAll(/0x[0-9a-fA-F]{40}\b/g)].map(x => x[0]);
  return matches[matches.length - 1] || null;
}

function parseTxHash(stdout) {
  const m = stdout.match(/Transaction Hash['"]?\s*[:=]\s*['"]?(0x[0-9a-fA-F]{64})/);
  if (m) return m[1];
  const fallback = stdout.match(/0x[0-9a-fA-F]{64}/);
  return fallback ? fallback[0] : null;
}

async function deployOne(row) {
  const t0 = Date.now();
  const result = {
    market_id: row.market_id,
    binding_domain: row.binding_domain,
    deep_url: row.deep_url,
    expected_outcome: EXPECTED[row.market_id] || 'unknown',
    deploy_ok: false,
    deploy_address: null,
    deploy_error: null,
    resolve_ok: false,
    resolve_tx: null,
    resolve_error: null,
    raw_outcome: null,
    raw_status: null,
    raw_analysis_snippet: null,
    match: null,
    elapsed_ms: 0,
  };

  // Step 1: deploy
  const ctorArgs = row.ctor_args.map(a => typeof a === 'string' ? a : JSON.stringify(a));
  const deployArgs = ['deploy', '--contract', CONTRACT, '--rpc', RPC, '--args', ...ctorArgs];
  logIt(`[${row.market_id}] deploying...`);
  const dep = await execGenlayer(deployArgs);
  // Save full deploy stdout/stderr for debugging
  fs.writeFileSync(`/tmp/deploy_${row.market_id}_stdout.txt`, dep.stdout);
  fs.writeFileSync(`/tmp/deploy_${row.market_id}_stderr.txt`, dep.stderr);
  if (dep.code !== 0) {
    result.deploy_error = (dep.stderr || dep.stdout).slice(0, 500);
    result.elapsed_ms = Date.now() - t0;
    return result;
  }
  // Try BOTH stdout and stderr for the address
  const addr = parseDeployedAddress(dep.stdout) || parseDeployedAddress(dep.stderr);
  if (!addr) {
    result.deploy_error = `no address in deploy output (stdout last 300 chars: ${dep.stdout.slice(-300)})`;
    result.elapsed_ms = Date.now() - t0;
    return result;
  }
  result.deploy_ok = true;
  result.deploy_address = addr;
  logIt(`[${row.market_id}] deployed at ${addr}`);

  // Step 2: resolve
  const resolveArgs = ['write', addr, 'resolve', '--rpc', RPC, '--args', ''];
  logIt(`[${row.market_id}] resolving...`);
  const res = await execGenlayer(resolveArgs);
  if (res.code !== 0) {
    result.resolve_error = (res.stderr || res.stdout).slice(0, 500);
    result.elapsed_ms = Date.now() - t0;
    return result;
  }
  const txId = parseTxId(res.stdout);
  result.resolve_tx = txId;
  result.resolve_ok = true;
  logIt(`[${row.market_id}] resolved (tx ${txId?.slice(0, 14)}...)`);

  // Step 3: read result. genlayer call returns JS-literal-style output (single
  // quotes, unquoted keys), not JSON — extract via field-level regex.
  const callArgs = ['call', addr, 'get_dict', '--rpc', RPC];
  const call = await execGenlayer(callArgs);
  if (call.code === 0) {
    const outcomeM = call.stdout.match(/outcome:\s*['"](.*?)['"],/);
    const statusM = call.stdout.match(/status:\s*['"](.*?)['"],/);
    const analysisM = call.stdout.match(/analysis:\s*[`'"]([\s\S]*?)[`'"],\s*\n/);
    result.raw_outcome = outcomeM ? outcomeM[1] : '';
    result.raw_status = statusM ? statusM[1] : '';
    result.raw_analysis_snippet = analysisM ? analysisM[1].slice(0, 300) : '';
    fs.writeFileSync(`/tmp/call_${row.market_id}.txt`, call.stdout);
  }

  result.match = result.raw_outcome === result.expected_outcome;
  result.elapsed_ms = Date.now() - t0;
  return result;
}

// ---- main ----
async function main() {
  let rows = fs.readFileSync(INPUT, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
  if (opts.warmup) rows = rows.slice(0, 1);
  let alreadyDone = new Set();
  if (opts.resume && fs.existsSync(OUT_JSONL)) {
    const existing = fs.readFileSync(OUT_JSONL, 'utf-8').trim().split('\n').filter(l => l).map(l => JSON.parse(l));
    alreadyDone = new Set(existing.map(r => r.market_id));
    logIt(`Resume: skipping ${alreadyDone.size} already-done rows`);
  }
  rows = rows.filter(r => !alreadyDone.has(r.market_id));
  logIt(`Deploying ${rows.length} markets, concurrency=${opts.concurrency}`);

  const ws = fs.createWriteStream(OUT_JSONL, { flags: opts.resume ? 'a' : 'w' });
  let done = 0, deploys = 0, resolves = 0, matches = 0;
  const queue = [...rows];

  async function worker(workerId) {
    while (queue.length > 0) {
      const row = queue.shift();
      if (!row) break;
      try {
        const result = await deployOne(row);
        ws.write(JSON.stringify(result) + '\n');
        done++;
        if (result.deploy_ok) deploys++;
        if (result.resolve_ok) resolves++;
        if (result.match) matches++;
        logIt(`[w${workerId}] ${done}/${rows.length} | ${result.market_id} | deploy=${result.deploy_ok} resolve=${result.resolve_ok} outcome=${result.raw_outcome || 'ø'} expected=${result.expected_outcome} match=${result.match}`);
      } catch (e) {
        logIt(`[w${workerId}] FATAL on ${row.market_id}:`, e.message);
        ws.write(JSON.stringify({ market_id: row.market_id, fatal: e.message }) + '\n');
      }
    }
  }

  await Promise.all(Array.from({ length: opts.concurrency }, (_, i) => worker(i)));
  ws.end();

  logIt(`DONE. ${done} processed; ${deploys} deploys ok; ${resolves} resolves ok; ${matches} outcomes matched expected.`);
}

main().catch(e => { console.error(e); process.exit(1); });

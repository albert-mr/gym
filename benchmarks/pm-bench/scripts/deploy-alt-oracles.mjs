#!/usr/bin/env node
// Deploy IntelligentOracle contracts to GenLayer Studio for the ALT-bucket
// validated markets (2026-05-09). One contract per market. Resolves each, captures result.
//
// Usage:
//   node scripts/deploy-alt-oracles.mjs              # deploy + resolve + read all 16
//   node scripts/deploy-alt-oracles.mjs --warmup     # only the first row
//   node scripts/deploy-alt-oracles.mjs --concurrency 5    # default 5
//   node scripts/deploy-alt-oracles.mjs --resume     # skip rows already in alt-studio-results.jsonl

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = '/Users/albert/conductor/workspaces/gym/beijing/benchmarks/pm-bench';
const CONTRACT = path.join(ROOT, 'contracts/intelligent_oracle.py');
const INPUT = path.join(ROOT, 'data/markets/2026-05-09/alt-deploy.jsonl');
const OUT_JSONL = path.join(ROOT, 'data/markets/2026-05-09/alt-studio-results.jsonl');
const RPC = 'https://studio.genlayer.com/api';
const WALLET_PASSWORD = 'studio-test-2026-05-08';

const args = process.argv.slice(2);
const opts = {
  warmup: args.includes('--warmup'),
  resume: args.includes('--resume'),
  concurrency: 5,
};
const cIdx = args.indexOf('--concurrency');
if (cIdx >= 0) opts.concurrency = parseInt(args[cIdx + 1] || '5', 10);

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
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await _runOnce(subargs, opts);
    const blob = (r.stderr || '') + (r.stdout || '');
    const isRateLimited = /Rate limit exceeded/i.test(blob);
    if (!isRateLimited) return r;
    const wait = 4000 * (2 ** attempt);
    logIt(`  rate-limited; backing off ${wait}ms (attempt ${attempt+1}/5)`);
    await new Promise(res => setTimeout(res, wait));
  }
  return await _runOnce(subargs, opts);
}

function logIt(...parts) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}]`, ...parts);
}

function parseDeployedAddress(stdout) {
  const m = stdout.match(/Contract Address['"]?\s*[:=]\s*['"]?(0x[0-9a-fA-F]{40})/);
  if (m) return m[1];
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
    alt_source: row.alt_source,
    question: row.question,
    deep_url: row.deep_url,
    expected_outcome: row.expected_outcome,
    evidence: row.evidence,
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

  const ctorArgs = row.ctor_args.map(a => typeof a === 'string' ? a : JSON.stringify(a));
  const deployArgs = ['deploy', '--contract', CONTRACT, '--rpc', RPC, '--args', ...ctorArgs];
  logIt(`[${row.market_id}] deploying...`);
  const dep = await execGenlayer(deployArgs);
  fs.writeFileSync(`/tmp/alt_deploy_${row.market_id}_stdout.txt`, dep.stdout);
  fs.writeFileSync(`/tmp/alt_deploy_${row.market_id}_stderr.txt`, dep.stderr);
  if (dep.code !== 0) {
    result.deploy_error = (dep.stderr || dep.stdout).slice(0, 500);
    result.elapsed_ms = Date.now() - t0;
    return result;
  }
  const addr = parseDeployedAddress(dep.stdout) || parseDeployedAddress(dep.stderr);
  if (!addr) {
    result.deploy_error = `no address in deploy output (last 300 chars: ${dep.stdout.slice(-300)})`;
    result.elapsed_ms = Date.now() - t0;
    return result;
  }
  result.deploy_ok = true;
  result.deploy_address = addr;
  logIt(`[${row.market_id}] deployed at ${addr}`);

  const resolveArgs = ['write', addr, 'resolve', '--rpc', RPC, '--args', ''];
  logIt(`[${row.market_id}] resolving...`);
  const res = await execGenlayer(resolveArgs);
  if (res.code !== 0) {
    result.resolve_error = (res.stderr || res.stdout).slice(0, 500);
    result.elapsed_ms = Date.now() - t0;
    return result;
  }
  result.resolve_tx = parseTxHash(res.stdout);
  result.resolve_ok = true;
  logIt(`[${row.market_id}] resolved (tx ${result.resolve_tx?.slice(0, 14)}...)`);

  const callArgs = ['call', addr, 'get_dict', '--rpc', RPC];
  const call = await execGenlayer(callArgs);
  if (call.code === 0) {
    const outcomeM = call.stdout.match(/outcome:\s*['"](.*?)['"],/);
    const statusM = call.stdout.match(/status:\s*['"](.*?)['"],/);
    const analysisM = call.stdout.match(/analysis:\s*[`'"]([\s\S]*?)[`'"],\s*\n/);
    result.raw_outcome = outcomeM ? outcomeM[1] : '';
    result.raw_status = statusM ? statusM[1] : '';
    result.raw_analysis_snippet = analysisM ? analysisM[1].slice(0, 300) : '';
    fs.writeFileSync(`/tmp/alt_call_${row.market_id}.txt`, call.stdout);
  }

  result.match = result.raw_outcome === result.expected_outcome;
  result.elapsed_ms = Date.now() - t0;
  return result;
}

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
  logIt(`Deploying ${rows.length} ALT-bucket markets, concurrency=${opts.concurrency}`);

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
        logIt(`[w${workerId}] ${done}/${rows.length} | ${result.market_id} | ${result.alt_source.padEnd(20)} | deploy=${result.deploy_ok} resolve=${result.resolve_ok} outcome=${result.raw_outcome || 'ø'} expected=${result.expected_outcome} match=${result.match}`);
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

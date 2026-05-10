#!/usr/bin/env python3
"""Deploy IntelligentOracle contracts via direct RPC (no CLI).

Two-phase fire-and-forget pattern:
  Phase A: deploy all contracts (rate-limited to ~25/min). Fire-and-forget tx.
  Phase B: poll deploy receipts → contract addresses.
  Phase C: fire resolve calls (rate-limited).
  Phase D: poll resolve receipts → outcomes.
  Phase E: read final state via read_contract → JSONL.

Usage:
  python3 scripts/deploy_oracles_rpc.py [--resume] [--rate 20] [--limit N]
"""
from __future__ import annotations

import argparse
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / 'data/markets/2026-05-07/binding-render-deep-urls.jsonl'
OUT_JSONL = ROOT / 'data/markets/2026-05-07/studio-deploy-results.jsonl'
CONTRACT = ROOT / 'contracts/intelligent_oracle.py'

# Hard-coded keystore — load via genlayer-py with our wallet's PK
WALLET_KEYSTORE = Path.home() / '.genlayer/keystores/pm-bench-studio.json'
WALLET_PASSWORD = 'studio-test-2026-05-08'

# Strict-grade expected outcomes per market (ported from JS script)
EXPECTED = {
    '2161570': 'No', '2161580': 'No', '2161542': 'No', '2161551': 'No',
    '2161603': 'Yes', '2161534': 'No', '2161561': 'No', '2161590': 'No',
    '2161670': 'No', '2161671': 'No',
    '2062283': 'Yes', '2062284': 'No', '2062285': 'No',
    '2062286': 'No', '2062287': 'Yes', '2062288': 'No',
    '2065556': 'Yes', '2065557': 'No', '2065558': 'No', '2065559': 'No',
    '2167450': 'No', '2167451': 'No', '2167452': 'Yes', '2167453': 'No',
    '2167454': 'No', '2167455': 'No', '2167456': 'No', '2167457': 'No',
    '2167458': 'No', '2167459': 'No',
    '2161781': 'No', '2161780': 'No', '2161771': 'No', '2161772': 'No',
    '2161773': 'No', '2161774': 'No', '2161775': 'No', '2161776': 'No',
    '2161777': 'Yes', '2161778': 'No',
    '2161986': 'No', '2161987': 'Yes', '2161988': 'No', '2161989': 'No',
    '2161990': 'No', '2161991': 'No', '2161992': 'No',
    '2162195': 'No', '2162196': 'No', '2162197': 'No',
    '2126784': 'No', '2126785': 'No', '2126786': 'Yes',
    '2126787': 'No', '2126788': 'No', '2126789': 'No',
    '2148546': 'Hurricanes', '2161337': 'Hurricanes',
    '2148547': 'Yes', '2148548': 'No', '2148550': 'No', '2148551': 'No',
    '2174971': 'Real Madrid',
}


def now_str() -> str:
    return time.strftime('%H:%M:%S')


def log(*parts: Any) -> None:
    print(f'[{now_str()}]', *parts, flush=True)


class RateLimiter:
    """Simple sliding-window rate limiter."""

    def __init__(self, per_minute: int = 20):
        self.per_minute = per_minute
        self.timestamps: list[float] = []

    def wait(self) -> None:
        while True:
            now = time.time()
            cutoff = now - 60
            self.timestamps = [t for t in self.timestamps if t > cutoff]
            if len(self.timestamps) < self.per_minute:
                self.timestamps.append(now)
                return
            sleep_for = max(0.1, 60 - (now - self.timestamps[0]) + 0.5)
            time.sleep(sleep_for)


def load_wallet():
    """Load encrypted keystore via eth_account."""
    from eth_account import Account
    keystore = json.loads(WALLET_KEYSTORE.read_text())
    pk = Account.decrypt(keystore, WALLET_PASSWORD)
    return Account.from_key(pk)


def load_existing_results() -> dict[str, dict]:
    """Markets already in JSONL keyed by market_id."""
    if not OUT_JSONL.exists():
        return {}
    out = {}
    for line in OUT_JSONL.read_text().splitlines():
        if not line.strip():
            continue
        try:
            r = json.loads(line)
            out[r['market_id']] = r
        except Exception:
            pass
    return out


def append_result(row: dict) -> None:
    with OUT_JSONL.open('a') as f:
        f.write(json.dumps(row) + '\n')


def deploy_one(client, contract_code: str, market: dict, limiter: RateLimiter) -> dict:
    """Phase 1: submit deploy tx, return tx_id (no wait for L2 consensus)."""
    market_id = market['market_id']
    args = market['ctor_args']

    limiter.wait()
    t0 = time.time()
    try:
        tx_id = client.deploy_contract(
            code=contract_code,
            args=args,
        )
        return {'market_id': market_id, 'deploy_tx': tx_id, 'phase': 'submitted',
                'submit_ms': int((time.time() - t0) * 1000)}
    except Exception as e:
        return {'market_id': market_id, 'deploy_tx': None, 'phase': 'submit-failed',
                'error': str(e)[:300], 'submit_ms': int((time.time() - t0) * 1000)}


def wait_for_address(client, tx_id: str, deadline_s: int = 600) -> str | None:
    """Phase 2: poll deploy receipt → contract address."""
    end = time.time() + deadline_s
    while time.time() < end:
        try:
            receipt = client.wait_for_transaction_receipt(tx_id, status='ACCEPTED', retries=1)
            data = receipt.get('data') or {}
            addr = data.get('contract_address')
            if addr:
                return addr
        except Exception:
            pass
        time.sleep(5)
    return None


def fire_resolve(client, addr: str, limiter: RateLimiter) -> str | None:
    """Phase 3: fire resolve write, return tx_id."""
    limiter.wait()
    try:
        return client.write_contract(
            address=addr,
            function_name='resolve',
            args=[''],
        )
    except Exception as e:
        log(f'  resolve fire failed for {addr}: {e}')
        return None


def wait_resolve(client, tx_id: str, deadline_s: int = 900) -> dict | None:
    """Phase 4: poll resolve receipt → finalized."""
    end = time.time() + deadline_s
    while time.time() < end:
        try:
            receipt = client.wait_for_transaction_receipt(tx_id, status='FINALIZED', retries=1)
            return receipt
        except Exception:
            pass
        time.sleep(8)
    return None


def read_state(client, addr: str) -> dict | None:
    """Phase 5: read get_dict on resolved contract."""
    try:
        return client.read_contract(address=addr, function_name='get_dict')
    except Exception as e:
        log(f'  read failed for {addr}: {e}')
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--resume', action='store_true', help='skip rows already in JSONL')
    parser.add_argument('--rate', type=int, default=20, help='requests per minute (default 20)')
    parser.add_argument('--limit', type=int, default=0, help='limit to N markets (0=all)')
    parser.add_argument('--workers', type=int, default=8, help='parallel workers within rate budget')
    args = parser.parse_args()

    from genlayer_py import create_client, studionet
    account = load_wallet()
    client = create_client(chain=studionet, account=account)
    log(f'Wallet: {account.address}')

    rows = [json.loads(l) for l in INPUT.read_text().splitlines() if l.strip()]
    if args.limit:
        rows = rows[:args.limit]
    if args.resume:
        existing = load_existing_results()
        before = len(rows)
        rows = [r for r in rows if r['market_id'] not in existing or
                not (existing[r['market_id']].get('deploy_ok') and existing[r['market_id']].get('resolve_ok'))]
        log(f'Resume: skipping {before - len(rows)} already-done; {len(rows)} to process')
    if not rows:
        log('Nothing to do.')
        return

    contract_code = CONTRACT.read_text()
    limiter = RateLimiter(per_minute=args.rate)
    log(f'Processing {len(rows)} markets, rate={args.rate}/min, workers={args.workers}')

    # Phase A+B+C+D+E pipelined: per-market thread runs full lifecycle.
    # Rate-limiter ensures we don't exceed Studio's 30/min budget across all threads.
    def process_one(market: dict) -> dict:
        market_id = market['market_id']
        result = {
            'market_id': market_id,
            'binding_domain': market.get('binding_domain'),
            'deep_url': market.get('deep_url'),
            'expected_outcome': EXPECTED.get(market_id, 'unknown'),
            'deploy_ok': False, 'deploy_address': None, 'deploy_tx': None, 'deploy_error': None,
            'resolve_ok': False, 'resolve_tx': None, 'resolve_error': None,
            'raw_outcome': None, 'raw_status': None, 'raw_analysis_snippet': None,
            'match': None, 'elapsed_ms': 0,
        }
        t0 = time.time()
        try:
            # Phase 1: deploy
            d = deploy_one(client, contract_code, market, limiter)
            if not d.get('deploy_tx'):
                result['deploy_error'] = d.get('error', 'no tx_id')
                return result
            result['deploy_tx'] = d['deploy_tx']
            log(f'[{market_id}] deploy fired (tx={d["deploy_tx"][:12]}...)')

            # Phase 2: wait for address
            addr = wait_for_address(client, d['deploy_tx'])
            if not addr:
                result['deploy_error'] = 'address timeout'
                return result
            result['deploy_ok'] = True
            result['deploy_address'] = addr
            log(f'[{market_id}] deployed at {addr}')

            # Phase 3: fire resolve
            rtx = fire_resolve(client, addr, limiter)
            if not rtx:
                result['resolve_error'] = 'resolve fire failed'
                return result
            result['resolve_tx'] = rtx
            log(f'[{market_id}] resolve fired (tx={rtx[:12]}...)')

            # Phase 4: wait for resolve receipt
            r_rcpt = wait_resolve(client, rtx)
            if not r_rcpt:
                result['resolve_error'] = 'resolve receipt timeout'
                return result
            result['resolve_ok'] = True

            # Phase 5: read state
            state = read_state(client, addr)
            if state:
                result['raw_outcome'] = state.get('outcome', '')
                result['raw_status'] = state.get('status', '')
                result['raw_analysis_snippet'] = (state.get('analysis', '') or '')[:300]
                result['match'] = result['raw_outcome'] == result['expected_outcome']
        except Exception as e:
            result['deploy_error'] = (result.get('deploy_error') or '') + f' fatal: {e}'[:300]
        finally:
            result['elapsed_ms'] = int((time.time() - t0) * 1000)
        return result

    done = 0
    matched = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(process_one, m): m for m in rows}
        for fut in as_completed(futures):
            row = fut.result()
            done += 1
            if row.get('match'):
                matched += 1
            append_result(row)
            log(f'{done}/{len(rows)} | {row["market_id"]} | '
                f'deploy={row["deploy_ok"]} resolve={row["resolve_ok"]} '
                f'outcome={row["raw_outcome"] or "ø"} expected={row["expected_outcome"]} '
                f'match={row["match"]}')

    log(f'DONE. {done} processed; {matched} matched expected.')


if __name__ == '__main__':
    main()

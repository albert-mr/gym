// Type declarations for db-writers.mjs (plain ESM module shared by tsx-run TS scripts
// and node-run mjs scripts). The runtime implementation lives in db-writers.mjs.

export interface Sql {
  <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  (rows: unknown, ...cols: string[]): unknown;
  begin<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
  end(): Promise<void>;
  unsafe<T = unknown>(s: string): Promise<T[]>;
  json<T = unknown>(v: T): unknown;
}

export const sql: Sql;

export function createPoll(date: string, scriptVersion?: string, notes?: Record<string, unknown> | null): Promise<number>;
export function finishPoll(pollId: number, marketsSeen: number): Promise<void>;
export function upsertMarkets(rows: ReadonlyArray<Record<string, unknown>>): Promise<number>;
export function insertObservations(pollId: number, rows: ReadonlyArray<Record<string, unknown>>): Promise<number>;

export interface GateEvaluation {
  marketId: string;
  passed: boolean;
  droppedAtGate: number | null;
  dropReason: string | null;
  bucket: string | null;
  bindingDomain: string | null;
  bindingUrl: string | null;
  notes: Record<string, unknown> | null;
}

export function insertGateEvaluations(
  pollId: number,
  evaluatedFor: string,
  evaluations: ReadonlyArray<GateEvaluation>,
): Promise<number>;

export interface OutcomeRow {
  id: string;
  winner: string | null;
  outcomePrices: unknown;
  endDate: string | null;
  closedTime: string | null;
}
export function upsertOutcomes(rows: ReadonlyArray<OutcomeRow>): Promise<number>;
export function close(): Promise<void>;

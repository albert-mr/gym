const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateArg(s: string | null | undefined): string | null {
  if (s === null || s === undefined) return null;
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== s) return null;
  return s;
}

export function requireDateArg(name: string, value: string | undefined): string {
  if (value === undefined) {
    console.error(`${name} requires YYYY-MM-DD`);
    process.exit(2);
  }
  const parsed = parseDateArg(value);
  if (!parsed) {
    console.error(`${name} invalid: ${value} (expected YYYY-MM-DD, e.g. 2026-05-07)`);
    process.exit(2);
  }
  return parsed;
}

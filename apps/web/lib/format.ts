export const pct = (n: number, d: number, digits = 1): string => {
  if (!d) return '—';
  return `${((100 * n) / d).toFixed(digits)}%`;
};

export const num = (n: number): string => n.toLocaleString();

export const shortDate = (iso: string): string => iso.slice(0, 10);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// "2026-05-06" → "May 6, 2026"
export const longDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return iso;
  const month = MONTHS[parseInt(m[2], 10) - 1] ?? '';
  return `${month} ${parseInt(m[3], 10)}, ${m[1]}`;
};

export const pct = (n: number, d: number, digits = 1): string => {
  if (!d) return '—';
  return `${((100 * n) / d).toFixed(digits)}%`;
};

export const num = (n: number): string => n.toLocaleString();

export const shortDate = (iso: string): string => iso.slice(0, 10);

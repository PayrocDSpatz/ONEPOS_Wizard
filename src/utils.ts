export const currency = (n: number | string) => {
  const num = Number(n); if (!Number.isFinite(num)) return '$0.00';
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
};
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const toNum = (v: any, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

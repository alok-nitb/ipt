// Statistics used by the analysis. Checked against scipy and statsmodels.

export interface TestResult {
  kind: string;
  stat: string;
  value: number;
  n: number;
  p: number;
  /** effect size: rho, Cohen's w, epsilon-squared or rank-biserial */
  eff: number;
  rho?: number;
  w?: number;
  df?: number;
  minE?: number;
  lowShare?: number;
}
export interface Proportion { k: number; n: number; p: number | null; lo: number | null; hi: number | null }

const fix = (x: number, d = 2) => x.toFixed(d);

export const mean = (a: number[]): number | null => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export function variance(a: number[]): number | null {
  if (a.length < 2) return null;
  const m = mean(a)!;
  return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
}

/* ---------- distributions ---------- */
function lgamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, t = x + 5.5, s = 1.000000000190015;
  t -= (x + 0.5) * Math.log(t);
  for (const v of c) s += v / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}
function betacf(a: number, b: number, x: number): number {
  const qab = a + b, qap = a + 1, qam = a - 1, tiny = 1e-30;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}
function ibeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
function gammq(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let ap = a, s = 1 / a, d = s;
    for (let n = 0; n < 400; n++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-13) break; }
    return 1 - s * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  let b = x + 1 - a, c = 1e30, d = 1 / b, h = d;
  for (let i = 1; i < 400; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-13) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
const pT = (t: number, df: number) => ibeta(df / 2, 0.5, df / (df + t * t));
const pChi = (x: number, df: number) => gammq(df / 2, x / 2);
const pZ = (z: number) => gammq(0.5, (z * z) / 2);

/* ---------- rank tests ---------- */
function ranks(a: number[]): number[] {
  const idx = a.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
  const r = new Array<number>(a.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const rk = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = rk;
    i = j + 1;
  }
  return r;
}
function tieSum(a: number[]): number {
  const c = new Map<number, number>();
  a.forEach((v) => c.set(v, (c.get(v) ?? 0) + 1));
  let s = 0;
  c.forEach((t) => { s += t ** 3 - t; });
  return s;
}
type Maybe = number | null | undefined;

export function spearman(x: Maybe[], y: Maybe[]): TestResult | null {
  const pairs = x.map((v, i) => [v, y[i]] as const).filter((p): p is readonly [number, number] => p[0] != null && p[1] != null);
  const n = pairs.length;
  if (n < 8) return null;
  const rx = ranks(pairs.map((p) => p[0])), ry = ranks(pairs.map((p) => p[1]));
  const mx = mean(rx)!, my = mean(ry)!;
  let sxy = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sxy += (rx[i] - mx) * (ry[i] - my); sx += (rx[i] - mx) ** 2; sy += (ry[i] - my) ** 2; }
  if (!sx || !sy) return null;
  const rho = sxy / Math.sqrt(sx * sy);
  const t = rho * Math.sqrt((n - 2) / Math.max(1e-12, 1 - rho * rho));
  return { kind: 'Spearman', stat: `ρ = ${fix(rho)}`, value: rho, rho, n, p: pT(t, n - 2), eff: rho };
}

/** Chi-square on an r × c table, Yates-corrected when 2 × 2. Effect size is Cohen's w. */
export function chiSquare(table: number[][]): TestResult | null {
  const rows = table.filter((r) => r.some((v) => v));
  if (rows.length < 2) return null;
  const keep = rows[0].map((_, j) => rows.some((r) => r[j]));
  const M = rows.map((r) => r.filter((_, j) => keep[j]));
  const nc = M[0].length;
  if (nc < 2) return null;
  const R = M.map((r) => r.reduce((a, b) => a + b, 0)), C = M[0].map((_, j) => M.reduce((a, r) => a + r[j], 0));
  const n = R.reduce((a, b) => a + b, 0);
  if (n < 10) return null;
  const df = (M.length - 1) * (nc - 1);
  let x = 0, rawX = 0, minE = Infinity, low = 0;
  M.forEach((r, i) => r.forEach((o, j) => {
    const E = (R[i] * C[j]) / n, d = Math.abs(o - E);
    minE = Math.min(minE, E);
    if (E < 5) low++;
    rawX += (o - E) ** 2 / E;
    x += (df === 1 ? Math.max(0, d - Math.min(0.5, d)) : d) ** 2 / E;
  }));
  const w = Math.sqrt(rawX / n);
  return { kind: 'Chi-square', stat: `χ²(${df}) = ${fix(x)}`, value: x, df, n, p: pChi(x, df), minE, lowShare: low / (M.length * nc), w, eff: w };
}

export function kruskal(groups: number[][]): TestResult | null {
  const G = groups.filter((g) => g.length >= 3);
  if (G.length < 2) return null;
  const all = G.flat(), n = all.length, rk = ranks(all);
  let i = 0, s = 0;
  G.forEach((g) => { let sum = 0; g.forEach(() => { sum += rk[i++]; }); s += (sum * sum) / g.length; });
  const C = 1 - tieSum(all) / (n ** 3 - n);
  if (!C) return null;
  const H = ((12 / (n * (n + 1))) * s - 3 * (n + 1)) / C, df = G.length - 1;
  return { kind: 'Kruskal–Wallis', stat: `H(${df}) = ${fix(H)}`, value: H, df, n, p: pChi(H, df), eff: H / (n - 1) };
}

export function mannWhitney(a: number[], b: number[]): TestResult | null {
  if (a.length < 5 || b.length < 5) return null;
  const all = [...a, ...b], n = all.length, rk = ranks(all), n1 = a.length, n2 = b.length;
  const U = rk.slice(0, n1).reduce((x, y) => x + y, 0) - (n1 * (n1 + 1)) / 2, mu = (n1 * n2) / 2;
  const sd = Math.sqrt(((n1 * n2) / 12) * (n + 1 - tieSum(all) / (n * (n - 1))));
  if (!sd) return null;
  const z = Math.max(0, Math.abs(U - mu) - 0.5) / sd;
  return { kind: 'Mann–Whitney', stat: `U = ${fix(U, 0)}`, value: U, n, p: pZ(z), eff: (2 * U) / (n1 * n2) - 1 };
}

/* ---------- reliability, intervals, adjustment ---------- */
export function cronbach(items: Maybe[][]): { a: number; n: number } | null {
  const R = items[0].map((_, i) => items.map((it) => it[i])).filter((r): r is number[] => r.every((v) => v != null));
  const k = items.length;
  if (R.length < 8) return null;
  const iv = items.map((_, j) => variance(R.map((r) => r[j]))!);
  const tv = variance(R.map((r) => r.reduce((a, b) => a + b, 0)));
  if (!tv) return null;
  return { a: (k / (k - 1)) * (1 - iv.reduce((a, b) => a + b, 0) / tv), n: R.length };
}
export function wilson(k: number, n: number): { lo: number | null; hi: number | null } {
  if (!n) return { lo: null, hi: null };
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { lo: c - h, hi: c + h };
}
export function holm(ps: (number | null)[]): (number | null)[] {
  const idx = ps.map((p, i) => [p, i] as const).filter((x): x is readonly [number, number] => x[0] != null).sort((a, b) => a[0] - b[0]);
  const out: (number | null)[] = ps.map(() => null);
  let run = 0;
  idx.forEach(([p, i], k) => { run = Math.max(run, Math.min(1, p * (idx.length - k))); out[i] = run; });
  return out;
}

/* ---------- binary logit (Newton–Raphson) ---------- */
export interface Predictor<T> { t: string; phrase: string; f: (r: T) => boolean | null }
export interface LogitRow { t: string; phrase: string; b: number; se: number; or: number; lo: number; hi: number; p: number }
export interface LogitFit {
  n: number; events: number; ll: number; lr: number; p: number; r2: number; accuracy: number; baseline: number; epv: number; rows: LogitRow[];
}
function invert(M: number[][]): number[][] | null {
  const n = M.length, A = M.map((r, i) => [...r, ...r.map((_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    if (Math.abs(A[p][i]) < 1e-10) return null;
    [A[i], A[p]] = [A[p], A[i]];
    const d = A[i][i];
    A[i] = A[i].map((v) => v / d);
    for (let k = 0; k < n; k++) if (k !== i) { const m = A[k][i]; A[k] = A[k].map((v, j) => v - m * A[i][j]); }
  }
  return A.map((r) => r.slice(n));
}
export function logit<T>(rows: T[], outcome: (r: T) => boolean | null, preds: Predictor<T>[]): LogitFit | null {
  const D = rows
    .map((r) => [outcome(r), ...preds.map((p) => p.f(r))])
    .filter((d): d is boolean[] => d.every((v) => v != null))
    .map((d) => d.map(Number));
  const n = D.length;
  if (n < 40) return null;
  const y = D.map((d) => d[0]), X = D.map((d) => [1, ...d.slice(1)]), k = X[0].length;
  const ev = y.reduce((a, b) => a + b, 0);
  if (Math.min(ev, n - ev) < 10) return null;
  const eta = (x: number[], b: number[]) => x.reduce((s, v, j) => s + v * b[j], 0);
  let b = new Array<number>(k).fill(0), V: number[][] | null = null, ok = false;
  for (let it = 0; it < 50; it++) {
    const g = new Array<number>(k).fill(0), H = Array.from({ length: k }, () => new Array<number>(k).fill(0));
    X.forEach((x, i) => {
      const p = 1 / (1 + Math.exp(-eta(x, b))), w = p * (1 - p);
      for (let j = 0; j < k; j++) { g[j] += x[j] * (y[i] - p); for (let m = 0; m < k; m++) H[j][m] += w * x[j] * x[m]; }
    });
    V = invert(H);
    if (!V) return null;
    const step = V.map((r) => r.reduce((s, v, j) => s + v * g[j], 0));
    b = b.map((v, j) => v + step[j]);
    if (b.some((v) => Math.abs(v) > 12)) return null; // separation
    if (Math.max(...step.map(Math.abs)) < 1e-9) { ok = true; break; }
  }
  if (!ok || !V) return null;
  let ll = 0, hit = 0;
  X.forEach((x, i) => { const p = 1 / (1 + Math.exp(-eta(x, b))); ll += y[i] ? Math.log(p) : Math.log(1 - p); hit += Number(p >= 0.5 === (y[i] === 1)); });
  const pb = ev / n, l0 = ev * Math.log(pb) + (n - ev) * Math.log(1 - pb), lr = 2 * (ll - l0), cov = V;
  return {
    n, events: ev, ll, lr, p: pChi(lr, k - 1), r2: 1 - ll / l0, accuracy: hit / n, baseline: Math.max(pb, 1 - pb), epv: Math.min(ev, n - ev) / (k - 1),
    rows: preds.map((p, j) => {
      const se = Math.sqrt(cov[j + 1][j + 1]), c = b[j + 1];
      return { t: p.t, phrase: p.phrase, b: c, se, or: Math.exp(c), lo: Math.exp(c - 1.96 * se), hi: Math.exp(c + 1.96 * se), p: pZ(c / se) };
    }),
  };
}

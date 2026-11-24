// Survey measures, hypothesis tests, models and written conclusions.
import { QA, QB, QSA, QSB, type Question } from './questions.ts';
import { chiSquare, cronbach, holm, kruskal, logit, mannWhitney, mean, spearman, wilson, type LogitFit, type Proportion, type TestResult } from './stats.ts';
import { listOf, lower, num, pct, pText } from './format.ts';

export type Site = 'U1' | 'U2';
export type Source = 'U1' | 'U2' | 'both' | 'mine';
export type Form = 'A' | 'B';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = { [key: string]: any; site?: Site; arm?: number; consent?: 0 | 1; sim?: 1; rid?: string };
export interface Responses { A: Row[]; B: Row[] }

export const SOURCE_NAME: Record<Source, string> = { U1: 'Set 1, site U1', U2: 'Set 2, site U2', both: 'Sets 1 and 2 together', mine: 'My responses' };
export const TARGET = { A: 230, siteA: 115, B: 450, group: 150, modelA: 200 };

export const has = (v: unknown) => v != null && v !== '';
export const isAnswered = (r: Row) => Object.keys(r).some((k) => /^[AB]\d/.test(k) && has(r[k]) && !(Array.isArray(r[k]) && !r[k].length));
export const usable = (rows: Row[], site: Site | 'all' = 'all') => rows.filter((r) => r.consent !== 1 && isAnswered(r) && (site === 'all' || r.site === site));

type Pred = (r: Row) => boolean | null;
export function prop(rows: Row[], fn: Pred): Proportion {
  let k = 0, n = 0;
  rows.forEach((r) => { const v = fn(r); if (v == null) return; n++; if (v) k++; });
  return { k, n, p: n ? k / n : null, ...wilson(k, n) };
}
export const isIn = (id: string, set: number[]): Pred => (r) => (has(r[id]) ? set.includes(r[id]) : null);
const includes = (id: string, i: number): Pred => (r) => (Array.isArray(r[id]) && r[id].length ? r[id].includes(i) : null);
export const column = (rows: Row[], id: string): (number | null)[] => rows.map((r) => (has(r[id]) ? r[id] : null));
const bin = (id: string, set: number[]) => (r: Row) => (has(r[id]) ? Number(set.includes(r[id])) : null);
function cross(rows: Row[], fr: (r: Row) => number | null, nr: number, fc: (r: Row) => number | null, nc: number) {
  const t = Array.from({ length: nr }, () => new Array<number>(nc).fill(0));
  rows.forEach((r) => { const a = fr(r), b = fc(r); if (a == null || b == null) return; t[a][b]++; });
  return t;
}

/* ---------- stop duration and bay acceptance ---------- */
/** Form A Q11 class mid-points and limits, seconds */
export const DWELL_MID = [5, 15, 25, 45, 75];
export const DWELL_EDGE = [0, 10, 20, 30, 60, 90];
export const dwellOf = (r: Row): number | null => (has(r.A11) ? DWELL_MID[r.A11] : null);
export function dwellPercentile(rows: Row[], q: number): number | null {
  const c = [0, 0, 0, 0, 0];
  let n = 0;
  rows.forEach((r) => { if (has(r.A11)) { c[r.A11]++; n++; } });
  if (!n) return null;
  let t = q * n, i = 0;
  while (i < 4 && t > c[i]) { t -= c[i]; i++; }
  return DWELL_EDGE[i] + (c[i] ? t / c[i] : 0) * (DWELL_EDGE[i + 1] - DWELL_EDGE[i]);
}
export const BAY_A = [0, 25, 50, 75, 100, 150];
export const BAY_B = [0, 30, 50, 100, 150];
export function acceptance(rows: Row[], id: string, bounds: number[], d: number): number | null {
  const v = rows.map((r) => r[id]).filter(has);
  if (!v.length) return null;
  return v.reduce((s: number, k: number) => { const lo = bounds[k], hi = bounds[k + 1]; return s + (d <= lo ? 1 : d >= hi ? 0 : (hi - d) / (hi - lo)); }, 0) / v.length;
}
export function offsetAt(rows: Row[], id: string, bounds: number[], level: number): number | null {
  let best: number | null = null;
  for (let d = 0; d <= 150; d++) { const a = acceptance(rows, id, bounds, d); if (a == null) return null; if (a >= level) best = d; }
  return best;
}

/* ---------- measures ---------- */
export const isIPT = (r: Row) => r.B1 === 1 || r.B1 === 2;
const sharedRoute: Pred = (r) => (has(r.A2) ? r.A2 === 0 : null);
const seeks: Pred = (r) => (Array.isArray(r.A7) && has(r.A14) ? r.A7.includes(2) || r.A7.includes(3) || r.A14 >= 2 : null);
export const highObstruction: Pred = (r) => (has(r.A9) && has(r.A10) && has(r.A11) ? [0, 1].includes(r.A9) && [1, 2].includes(r.A10) && r.A11 >= 2 : null);

export function measures(A: Row[], B: Row[]) {
  const BI = B.filter(isIPT);
  return {
    nA: A.length, nB: B.length, nI: BI.length, nP: B.filter((r) => r.B1 === 0).length,
    within50: prop(A, isIn('A9', [0, 1])), inLane: prop(A, isIn('A10', [1, 2])), ho: prop(A, highObstruction), long30: prop(A, isIn('A11', [3, 4])),
    seek: prop(A, seeks), wait30: prop(A, isIn('A14', [2, 3, 4])), queue: prop(A, isIn('A18', [3, 4])), affect: prop(A, isIn('A17', [3, 4])),
    fined: prop(A, isIn('A19', [1, 2])), noPlace: prop(A, isIn('A20', [3, 4])), noStand: prop(A, isIn('A21', [1])), digital: prop(A, isIn('A13', [2, 3])),
    shift: prop(A, isIn('A15', [3, 4])), sup: prop(A, isIn('A22', [3, 4])), opp: prop(A, isIn('A22', [0, 1])),
    dwell: mean(A.map(dwellOf).filter((v): v is number => v != null)), p85: dwellPercentile(A, 0.85), median: dwellPercentile(A, 0.5),
    unsafe: prop(B, isIn('B18', [3, 4])), blocked: prop(B, isIn('B15', [3, 4])), nearMiss: prop(B, isIn('B16', [2, 3])), between: prop(B, isIn('B13', [2])),
    difficult: prop(B, isIn('B14', [3, 4])), iptCause: prop(B, includes('B20', 1)), iptHard: prop(B, isIn('B17', [3])), delay2: prop(B, isIn('B19', [3, 4])),
    travelTime: prop(B, isIn('B21', [2, 3])), willing: prop(B, isIn('B22', [0])), cond: prop(B, isIn('B22', [2])), refuse: prop(B, isIn('B22', [1])),
    bLane: prop(BI, isIn('B11', [1, 2])), bMid: prop(BI, isIn('B7', [4])), bCorner: prop(BI, isIn('B7', [2])),
  };
}
export type Measures = ReturnType<typeof measures>;

export interface Dist { counts: number[]; n: number }
export function dist(rows: Row[], q: Question): Dist {
  const counts = (q.o ?? []).map(() => 0);
  let n = 0;
  rows.forEach((r) => {
    const v = r[q.id];
    if (q.multi) { if (Array.isArray(v) && v.length) { n++; v.forEach((k: number) => counts[k]++); } } else if (has(v)) { n++; counts[v]++; }
  });
  return { counts, n };
}
export function topAnswer(rows: Row[], q: Question) {
  const d = dist(rows, q);
  if (!d.n) return null;
  const i = d.counts.indexOf(Math.max(...d.counts));
  return { option: q.o![i], p: d.counts[i] / d.n, n: d.n };
}
/** mean stated stop by the answer to a question */
export function meanDwellBy(rows: Row[], q: Question, min = 3) {
  return q.o!
    .map((option, i) => { const v = rows.filter((r) => r[q.id] === i).map(dwellOf).filter((x): x is number => x != null); return { option, n: v.length, mean: mean(v) ?? 0 }; })
    .filter((x) => x.n >= min);
}

/* ---------- hypothesis tests ---------- */
export interface SurveyTest extends TestResult { key: string; obj: string; q: string; name: string; desc: string; adj: number; sig: boolean }
const pair = (p: Proportion, q: Proportion, a: string, b: string) => `${a} ${pct(p.p)}, ${b} ${pct(q.p)}`;

export function buildTests(A: Row[], B: Row[]): Record<string, SurveyTest> {
  const T: Record<string, SurveyTest> = {};
  const add = (key: string, obj: string, q: string, name: string, res: TestResult | null, desc = '') => { if (res) T[key] = { key, obj, q, name, desc, adj: 1, sig: false, ...res }; };
  const means = (id: string) => meanDwellBy(A, QSA[id]).map((x) => `${lower(x.option)} ${num(x.mean, 0)} s`).join(', ');
  const groups = (id: string) => QSA[id].o!.map((_, i) => A.filter((r) => r[id] === i && has(r.A11)).map((r) => r.A11 as number));
  const wait = isIn('A14', [2, 3, 4]), queue = isIn('A18', [3, 4]), unsafe = isIn('B18', [3, 4]), nm = isIn('B16', [2, 3]);
  add('fare', 'Obj 1', 'A Q11 by Q13', 'Stop duration by fare payment', kruskal(groups('A13')), means('A13'));
  add('veh', 'Obj 1', 'A Q11 by Q1', 'Stop duration by vehicle type', kruskal(groups('A1')), means('A1'));
  add('wait', 'Obj 1', 'A Q14 by Q2', 'Waiting 30 s or more by shared fixed-route service',
    chiSquare(cross(A, (r) => { const s = sharedRoute(r); return s == null ? null : Number(s); }, 2, bin('A14', [2, 3, 4]), 2)),
    pair(prop(A.filter((r) => sharedRoute(r) === true), wait), prop(A.filter((r) => sharedRoute(r) === false), wait), 'shared', 'other services'));
  add('waitdur', 'Obj 1', 'A Q14 with Q11', 'Waiting for passengers with stop duration', spearman(column(A, 'A14'), column(A, 'A11')));
  add('durEff', 'Obj 2', 'A Q11 with Q17', 'Stop duration with stated effect on vehicles behind', spearman(column(A, 'A11'), column(A, 'A17')));
  add('durQ', 'Obj 2', 'A Q11 with Q18', 'Stop duration with what happens behind', spearman(column(A, 'A11'), column(A, 'A18')));
  const lane = (r: Row) => (r.A10 === 3 ? null : has(r.A10) ? Number([1, 2].includes(r.A10)) : null);
  add('laneQ', 'Obj 2', 'A Q18 by Q10', 'Queue behind by in-lane stopping', chiSquare(cross(A, lane, 2, bin('A18', [3, 4]), 2)),
    pair(prop(A.filter((r) => lane(r) === 1), queue), prop(A.filter((r) => lane(r) === 0), queue), 'in lane', 'at kerb'));
  add('blkSafe', 'Obj 2', 'B Q15 with Q18', 'Blocking by stopped IPTs with feeling unsafe', spearman(column(B, 'B15'), column(B, 'B18')));
  add('blkEase', 'Obj 2', 'B Q15 with Q14', 'Blocking by stopped IPTs with difficulty of crossing', spearman(column(B, 'B15'), column(B, 'B14')));
  add('btwNm', 'Obj 2', 'B Q16 by Q13', 'Near-misses by crossing between vehicles', chiSquare(cross(B, bin('B13', [2]), 2, bin('B16', [2, 3]), 2)),
    pair(prop(B.filter((r) => r.B13 === 2), nm), prop(B.filter((r) => has(r.B13) && r.B13 !== 2), nm), 'between vehicles', 'elsewhere'));
  const two = B.filter((r) => r.B1 === 0 || isIPT(r)), byGroup = (r: Row) => Number(isIPT(r)), val = (id: string) => (r: Row) => (has(r[id]) ? (r[id] as number) : null);
  add('grpSafe', 'Obj 2', 'B Q18 by Q1', 'Feeling of safety: pedestrians and IPT users (2 × 5)', chiSquare(cross(two, byGroup, 2, val('B18'), 5)),
    pair(prop(two.filter((r) => !isIPT(r)), unsafe), prop(two.filter(isIPT), unsafe), 'unsafe: pedestrians', 'IPT users'));
  add('genSafe', 'Obj 2', 'B Q18 by Q3', 'Feeling unsafe by gender', chiSquare(cross(B, (r) => (r.B3 === 0 ? 0 : r.B3 === 1 ? 1 : null), 2, bin('B18', [3, 4]), 2)),
    pair(prop(B.filter((r) => r.B3 === 1), unsafe), prop(B.filter((r) => r.B3 === 0), unsafe), 'female', 'male'));
  add('supDist', 'Obj 3', 'A Q22 with Q23', 'Support for the rule with acceptable bay distance', spearman(column(A, 'A22'), column(A, 'A23')));
  add('grpUse', 'Obj 4', 'B Q22 by Q1', 'Would use a designated point: pedestrians and IPT users (2 × 3)', chiSquare(cross(two, byGroup, 2, val('B22'), 3)),
    pair(prop(two.filter((r) => !isIPT(r)), isIn('B22', [0])), prop(two.filter(isIPT), isIn('B22', [0])), 'yes: pedestrians', 'IPT users'));
  add('placeSup', 'Obj 5', 'A Q20 with Q22', 'No proper stopping place with support for the rule', spearman(column(A, 'A20'), column(A, 'A22')));
  add('fineSup', 'Obj 5', 'A Q22 by Q19', 'Support for the rule by fined or warned', chiSquare(cross(A, bin('A19', [1, 2]), 2, bin('A22', [3, 4]), 2)),
    pair(prop(A.filter((r) => r.A19 > 0), isIn('A22', [3, 4])), prop(A.filter((r) => r.A19 === 0), isIn('A22', [3, 4])), 'fined or warned', 'never'));
  const keys = Object.keys(T), adj = holm(keys.map((k) => T[k].p));
  keys.forEach((k, i) => { T[k].adj = adj[i]!; T[k].sig = adj[i]! < 0.05; });
  return T;
}
export const testText = (t?: SurveyTest) => (t ? `${t.stat}, n ${t.n}, adjusted ${pText(t.adj)}` : '');

/* ---------- logit models ---------- */
export function buildModels(A: Row[], both: boolean): { support: LogitFit | null; lane: LogitFit | null } {
  const shared = { t: 'Shared fixed-route service', phrase: 'run a shared fixed route', f: sharedRoute };
  const rented = { t: 'Rented vehicle', phrase: 'rent their vehicle', f: (r: Row) => (has(r.A5) ? r.A5 === 1 : null) };
  const exp = { t: 'More than 6 years’ experience', phrase: 'have more than 6 years’ experience', f: (r: Row) => (has(r.A3) ? r.A3 >= 3 : null) };
  const fined = { t: 'Fined or warned before', phrase: 'were fined or warned before', f: (r: Row) => (has(r.A19) ? r.A19 > 0 : null) };
  const place = { t: 'Agrees there is no proper place', phrase: 'agree there is no proper stopping place', f: (r: Row) => (has(r.A20) ? r.A20 >= 3 : null) };
  const waits = { t: 'Waits 30 s or more for passengers', phrase: 'wait 30 s or more for passengers', f: (r: Row) => (has(r.A14) ? r.A14 >= 2 : null) };
  const seek = { t: 'Calls, searches or waits for passengers', phrase: 'call, search or wait for passengers', f: seeks };
  const close = { t: 'Stops within 50 m', phrase: 'stop within 50 m', f: (r: Row) => (has(r.A9) ? r.A9 <= 1 : null) };
  const site = { t: 'Site U2 (higher flow)', phrase: 'work at site U2', f: (r: Row) => (r.site === 'U2' ? true : r.site === 'U1' ? false : null) };
  return {
    support: logit(A, (r) => (has(r.A22) ? r.A22 >= 3 : null), [shared, rented, exp, fined, place, waits]),
    lane: logit(A, (r) => (has(r.A10) && r.A10 !== 3 ? [1, 2].includes(r.A10) : null), [shared, seek, close, place, exp, both ? site : rented]),
  };
}
export function describeModel(m: LogitFit | null, withOr = false): string {
  if (!m) return '';
  const part = (up: boolean) => listOf(m.rows.filter((r) => r.p < 0.05 && r.or > 1 === up).map((r) => r.phrase + (withOr ? ` (OR ${num(r.or, 2)})` : '')), 'or');
  const more = part(true), less = part(false);
  return [more && `more likely among operators who ${more}`, less && `less likely among ${more ? 'those' : 'operators'} who ${less}`].filter(Boolean).join(', and ');
}

/* ---------- site comparison ---------- */
export interface CompareRow { key: string; t: string; form: Form; a: Proportion; b: Proportion; test: TestResult | null; p: number | null; adj: number | null }
export interface CompareScale { t: string; test: TestResult | null; p: number | null; adj: number | null }
export interface Comparison { rows: CompareRow[]; scales: CompareScale[]; a: Measures; b: Measures }
export function compareSites(A: Row[], B: Row[]): Comparison | null {
  const at = (R: Row[], s: Site) => R.filter((r) => r.site === s);
  const a = measures(at(A, 'U1'), at(B, 'U1')), b = measures(at(A, 'U2'), at(B, 'U2'));
  if (a.nA < 10 || b.nA < 10 || a.nB < 10 || b.nB < 10) return null;
  const defs: [keyof Measures, string, Form][] = [
    ['within50', 'Operators stopping within 50 m', 'A'], ['inLane', 'Operators stopping in the lane', 'A'], ['ho', 'High-obstruction operators', 'A'],
    ['long30', 'Stops longer than 30 s', 'A'], ['seek', 'Calling, searching or waiting', 'A'], ['queue', 'Operators reporting a queue behind', 'A'],
    ['sup', 'Operators supporting the bay rule', 'A'], ['blocked', 'Road users blocked often or always', 'B'], ['between', 'Crossing between vehicles', 'B'],
    ['nearMiss', 'Near-misses sometimes or often', 'B'], ['unsafe', 'Road users feeling unsafe', 'B'], ['delay2', 'Delay of 2 minutes or more', 'B'],
    ['iptCause', 'IPT stopping named as a cause of delay', 'B'], ['willing', 'Would use a designated point (yes)', 'B'],
  ];
  const rows: CompareRow[] = defs.map(([key, t, form]) => {
    const x = a[key] as Proportion, y = b[key] as Proportion, test = chiSquare([[x.k, x.n - x.k], [y.k, y.n - y.k]]);
    return { key, t, form, a: x, b: y, test, p: test?.p ?? null, adj: null };
  });
  const scaleDefs: [string, Row[], string][] = [['A11', A, 'Stop duration (A Q11)'], ['A18', A, 'What happens behind (A Q18)'], ['B14', B, 'Difficulty of crossing (B Q14)'], ['B18', B, 'Feeling unsafe (B Q18)']];
  const scales: CompareScale[] = scaleDefs.map(([id, R, t]) => {
    const v = (s: Site) => column(at(R, s), id).filter((x): x is number => x != null), test = mannWhitney(v('U1'), v('U2'));
    return { t, test, p: test?.p ?? null, adj: null };
  });
  const adj = holm([...rows.map((r) => r.p), ...scales.map((r) => r.p)]);
  rows.forEach((r, i) => { r.adj = adj[i]; });
  scales.forEach((r, i) => { r.adj = adj[rows.length + i]; });
  return { rows, scales, a, b };
}

/* ---------- comment themes ---------- */
const THEMES_A: [string, RegExp][] = [
  ['Passengers will not walk', /walk|paidal|door nahi|पैदल|get down|bay is far/i], ['Loss of income', /lose|kamai|rent |take (our|another)|सवारी कम|take our/i],
  ['No space / parking', /space|parking|parked|thela|किनारे|jagah|hold at least/i], ['Facilities and place of the bay', /shade|board|light|छाया|close to|just after|marked bay/i],
  ['Enforcement', /police|challan|enforce|पुलिस|traffic man/i],
];
const THEMES_B: [string, RegExp][] = [
  ['Stop location and facilities', /stop should|stand should|auto stop|auto stand|स्टॉप|far to the stop/i], ['Pedestrian crossing', /cross|zebra|ज़ेब्रा|island/i],
  ['IPT stopping', /auto|e-rick|ऑटो/i], ['Footpath and encroachment', /footpath|फुटपाथ|encroach|parked/i], ['Traffic control', /police|signal|speed|wrong side|turn right|पुलिस/i],
];
export function commentThemes(rows: Row[], form: Form) {
  const id = form === 'A' ? 'A25' : 'B25', defs = form === 'A' ? THEMES_A : THEMES_B, c = new Map<string, number>(), quotes = new Set<string>();
  let n = 0;
  rows.forEach((r) => {
    const s = String(r[id] ?? '').trim();
    if (!s) return;
    n++;
    quotes.add(s);
    const k = defs.find((x) => x[1].test(s))?.[0] ?? 'Other';
    c.set(k, (c.get(k) ?? 0) + 1);
  });
  return { n, list: [...c].sort((a, b) => b[1] - a[1]), quotes: [...quotes] };
}

/* ---------- full analysis ---------- */
export interface Conclusion { lead: string; text: string; tag: string }
export interface Analysis {
  source: Source; sim: boolean; single: boolean; raw: Responses; A: Row[]; B: Row[]; BI: Row[]; level: number; m: Measures;
  tests: Record<string, SurveyTest>; models: { support: LogitFit | null; lane: LogitFit | null }; compare: Comparison | null;
  offA: number | null; offB: number | null; offset: number | null; declinedA: number; declinedB: number;
  alphaB: { a: number; n: number } | null; alphaA: { a: number; n: number } | null; conclusions: Conclusion[]; notes: string[];
}
export function analyse(raw: Responses, source: Source, levelPct: number, site: Site | 'all' = 'all'): Analysis {
  const f = source === 'mine' ? site : 'all', A = usable(raw.A, f), B = usable(raw.B, f), level = levelPct / 100, m = measures(A, B);
  const tests = buildTests(A, B), both = (['U1', 'U2'] as Site[]).every((s) => A.some((r) => r.site === s));
  const models = buildModels(A, both), compare = compareSites(A, B);
  const offA = offsetAt(A, 'A23', BAY_A, level), offB = offsetAt(B, 'B23', BAY_B, level);
  const offset = offA != null && offB != null ? Math.min(offA, offB) : (offA ?? offB);
  const single = source === 'U1' || source === 'U2', sim = source !== 'mine' || raw.A.some((r) => r.sim) || raw.B.some((r) => r.sim);
  const T = tests, C: Conclusion[] = [], add = (lead: string, text: string, tag: string) => C.push({ lead, text, tag });
  if (m.nA) {
    add('Stopping location', `${pct(m.within50.p)} of operators usually stop within 50 m of the junction and ${pct(m.inLane.p)} stop partly or fully in the traffic lane. ${pct(m.ho.p)} combine both with stops over 20 s.`, 'Objective 1');
    add('Duration and waiting', `The stated mean stop is about ${num(m.dwell, 0)} s (85th percentile ${num(m.p85, 0)} s). ${pct(m.seek.p)} of operators call, search or wait for passengers, so part of the stopping time is avoidable.${T.fare?.sig ? ` Duration differs by fare payment: ${T.fare.desc}.` : ''}`, 'Objective 1');
    add('Effect on traffic', `${pct(m.queue.p)} of operators say a queue forms behind them.${T.durQ ? ` Longer stops ${T.durQ.sig ? (T.durQ.rho! > 0 ? 'go with' : 'go against') : 'show no significant link with'} queues behind (${testText(T.durQ)}).` : ''}${m.nB ? ` ${pct(m.iptCause.p)} of road users name IPT stopping as a main cause of delay.` : ''}`, 'Objective 2');
  }
  if (m.nB) {
    add('Pedestrian exposure', `${pct(m.blocked.p)} of road users say stopped IPTs often or always block their path or view, ${pct(m.between.p)} usually cross between vehicles, ${pct(m.nearMiss.p)} report near-misses sometimes or often and ${pct(m.unsafe.p)} feel unsafe.${T.blkSafe ? ` Blocking ${T.blkSafe.sig ? 'goes with' : 'shows no significant link with'} feeling ${T.blkSafe.sig && T.blkSafe.rho! < 0 ? 'safer' : 'unsafe'} (${testText(T.blkSafe)}).` : ''}`, 'Objective 2');
    if (m.bLane.n >= 10) add('IPT passengers', `${pct(m.bCorner.p)} board or alight at the corner and ${pct(m.bMid.p)} in the middle of the road; ${pct(m.bLane.p)} say the vehicle stopped partly or fully in the lane (n ${m.bLane.n}).`, 'Objective 2');
  }
  if (offset != null) add('Bay offset', `At least ${levelPct}% of operators accept a bay up to ${offA ?? '–'} m from the junction and at least ${levelPct}% of road users accept a walk up to ${offB ?? '–'} m, so about ${offset} m satisfies both. Compare the field-derived D_crit with this limit.`, 'Objective 3');
  const ta = m.nA ? topAnswer(A, QSA.A24) : null, tb = m.nB ? topAnswer(B, QSB.B24) : null;
  if (ta || tb) add('Preferred measures', [ta && `Operators most often choose “${ta.option}” (${pct(ta.p)}).`, tb && `Road users most often ask for “${tb.option}” (${pct(tb.p)}).`].filter(Boolean).join(' '), 'Objective 4');
  if (m.nA || m.nB) add('Acceptance', [m.nA && `${pct(m.sup.p)} of operators support a designated-bay rule and ${pct(m.opp.p)} oppose it.`, m.nB && `${pct(m.willing.p)} of road users would use a designated point and a further ${pct(m.cond.p)} would if distance and safety are acceptable.`].filter(Boolean).join(' '), 'Objective 5');
  if (models.support || models.lane) {
    const s = describeModel(models.support, true), l = describeModel(models.lane, true);
    add('What drives it', `${s ? `Support for the rule is ${s}` : 'No predictor of support is clear'}. ${l ? `In-lane stopping is ${l}` : 'No predictor of in-lane stopping is clear'}${m.nA < TARGET.modelA ? ' (below the planned 200 operators, so indicative)' : ''}.`, 'Objectives 1 and 5');
  }
  if (compare) {
    const top = compare.rows.filter((r) => r.adj != null && r.adj < 0.05).sort((x, y) => Math.abs(y.b.p! - y.a.p!) - Math.abs(x.b.p! - x.a.p!)).slice(0, 3);
    add('Site comparison', top.length ? `After adjustment U2 and U1 differ on ${top.map((r) => `${lower(r.t)} (U2 ${pct(r.b.p)}, U1 ${pct(r.a.p)})`).join('; ')}.` : 'No indicator differs significantly between the two sites after adjustment.', 'U1 and U2');
  }
  const short = m.nA < TARGET.A || m.nB < TARGET.B;
  const notes = [
    sim ? 'These responses are simulated. They show how the analysis works and are not findings about any Bhopal junction.' : '',
    single ? 'One site only. The targets of 230 operators and 450 road users apply to both sites together.' : short ? 'The sample is below the targets of 230 operators and 450 road users, so treat these as preliminary.' : 'The sample meets the targets of 230 operators and 450 road users.',
    'Answers are self-reported; video measurements remain the basis for dwell, queues and delay.',
  ].filter(Boolean);
  return {
    source, sim, single, raw, A, B, BI: B.filter(isIPT), level: levelPct, m, tests, models, compare, offA, offB, offset,
    declinedA: raw.A.filter((r) => r.consent === 1).length, declinedB: raw.B.filter((r) => r.consent === 1).length,
    alphaB: cronbach(['B14', 'B15', 'B16', 'B18'].map((id) => column(B, id))), alphaA: cronbach(['A6', 'A17', 'A18'].map((id) => column(A, id))),
    conclusions: C, notes,
  };
}
export const conclusionsText = (a: Analysis) =>
  [
    `IPT Survey Analyser: conclusions${a.sim ? ' (SIMULATED DATA, not field results)' : ''}`, `${SOURCE_NAME[a.source]}: ${a.m.nA} operators, ${a.m.nB} road users`,
    ...a.conclusions.map((c, i) => `${i + 1}. ${c.lead}. ${c.text} [${c.tag}]`), ...a.notes,
  ].join('\n');

/* ---------- data checks ---------- */
export function itemChecks(rows: Row[], form: Form) {
  return (form === 'A' ? QA : QB).filter((q) => q.o && !q.hide).map((q) => {
    const rr = q.ipt ? rows.filter(isIPT) : rows, d = dist(rr, q), missing = rr.length ? 1 - d.n / rr.length : null;
    const unclear = d.n ? q.o!.reduce((s, o, i) => s + (/not sure|^other$|cannot say|depends|prefer not/i.test(o) ? d.counts[i] : 0), 0) / d.n : 0;
    const mode = d.n ? Math.max(...d.counts) / d.n : 0, flags: string[] = [];
    if (missing != null && missing > 0.1) flags.push(`missing ${pct(missing)}`);
    if (unclear > 0.2) flags.push(`unclear ${pct(unclear)}`);
    if (mode > 0.8 && !q.multi) flags.push(`one answer ${pct(mode)}`);
    return { q, n: d.n, missing, flags };
  });
}
export function recordChecks(a: Analysis) {
  const { A, B } = a;
  return {
    routing: B.filter((r) => has(r.B1) && has(r.BR) && r.B1 !== r.BR).length,
    notIptAnswered: B.filter((r) => has(r.B1) && !isIPT(r) && has(r.B6)).length,
    oneCause: B.filter((r) => Array.isArray(r.B20) && r.B20.length === 1).length,
    neverButQueue: A.filter((r) => r.A6 === 0 && r.A18 >= 3).length,
    noSiteA: A.filter((r) => !r.site).length, noSiteB: B.filter((r) => !r.site).length,
  };
}

// Generates the two SIMULATED response sets used by the app.
//   npm run data
// Reads the question definitions from src/lib/questions.ts, writes four CSV files next to this
// script and the packed copy the app loads (src/data/sets.json).
// Every record is computer-generated. None of it is field data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {QA, QB} from '../src/lib/questions.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- random helpers (seeded, so the sets are reproducible) ---------- */
function rng(seed){return () => {seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;};}
let R = Math.random;
const norm = () => {let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);};
const pick = w => {const s = w.reduce((a, b) => a + b, 0); let x = R() * s; for (let i = 0; i < w.length; i++) {x -= w[i]; if (x < 0) return i;} return w.length - 1;};
const chance = p => R() < p;
// inverse normal CDF (Acklam)
function qn(p){const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];
  if(p<.02425){const q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
  if(p>1-.02425)return -qn(1-p);const q=p-.5,r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
// ordered category from a latent score: `share` is the base distribution in percent
function ord(z, share){const s = share.reduce((a, b) => a + b, 0); let c = 0; for (let i = 0; i < share.length - 1; i++) {c += share[i] / s; if (z < qn(c)) return i;} return share.length - 1;}
const unit = (parts, noise) => {const v = parts.reduce((a, [k]) => a + k * k, 0) + noise * noise; return parts.reduce((a, [k, x]) => a + k * x, 0) / Math.sqrt(v) + noise * norm() / Math.sqrt(v);};
const shuffle = a => {for (let i = a.length - 1; i > 0; i--) {const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]];} return a;};

/* ---------- open-text pools (no place names: the study sites are not final) ---------- */
const TXT_A = {
  walk: ['Passengers will not walk to the bay', 'Sawari door nahi chalti, pass me hi utarna chahti hai', 'सवारी दूर तक पैदल नहीं जाती', 'Old people and ladies with luggage cannot walk far', 'Passengers get down at the corner even if I say no', 'If bay is far, passenger will take another auto'],
  income: ['We will lose passengers to those who stop at the corner', 'Kamai kam ho jayegi agar door khada kiya', 'दूर रुकने से सवारी कम मिलेगी', 'Rule should be same for all, otherwise we lose income', 'Daily rent is high, we cannot miss passengers', 'App drivers will take our passengers near the junction'],
  space: ['No space on the side because of parked bikes', 'Road side is full of thelas and parked cars', 'किनारे पर गाड़ियाँ खड़ी रहती हैं, जगह नहीं मिलती', 'First remove parking then make a bay', 'Bay should hold at least 5 or 6 vehicles', 'E-rickshaw ke liye alag jagah honi chahiye'],
  facility: ['Need shade and a marked bay', 'Put a board so that passengers know where to stand', 'बे पर छाया और बोर्ड होना चाहिए', 'Light is needed at the stand in the evening', 'Make the bay just after the junction, not before', 'Bay should be close to the market side'],
  police: ['Police should allow short stops', 'Challan only those who wait long', 'पुलिस बिना कारण चालान करती है', 'One traffic man should manage the stand in the evening', 'Enforcement is only on some days'],
  other: ['Time limit of one minute is fine', 'We are ready if a proper place is given', 'ठीक है, अगर सबके लिए नियम एक हो', 'Buses also stop there, they should also be shifted']
};
const TXT_B = {
  crossing: ['Need a zebra crossing with a speed breaker', 'Crossing is very difficult in the evening', 'ज़ेब्रा क्रॉसिंग बनाइए', 'Vehicles do not stop for people crossing', 'Road cross karne me bahut time lagta hai', 'A small island in the middle would help', 'Children from the school find it hard to cross', 'Paint the crossing again, it is not visible'],
  ipt: ['Autos stop suddenly in front of people', 'E-rickshaws stand in the middle and block everything', 'ऑटो वाले कहीं भी रोक देते हैं', 'Autos at the corner hide the coming vehicles', 'Make a fixed place for autos', 'Auto wale sawari ke liye beech me khade rehte hain', 'Shared autos wait too long at the turning', 'Autos should not stop near the turning'],
  path: ['Footpath is occupied by shops and vehicles', 'फुटपाथ पर दुकानें लगी हैं', 'Remove encroachment so that we can walk', 'Parked two-wheelers force us onto the road', 'No footpath on one side of the road'],
  control: ['Traffic police needed in peak time', 'Install a signal for peak hours', 'शाम को ट्रैफिक पुलिस होनी चाहिए', 'Speed of bikes should be controlled', 'Wrong side driving is the main problem', 'People turn right without looking'],
  bay: ['Stop should be near, not more than 50 m', 'Stand should have light for women at night', 'स्टॉप पास में और रोशनी वाला होना चाहिए', 'Shade and seating at the auto stop', 'Auto stand and bus stop should be together', 'Old people cannot walk far to the stop'],
  other: ['Good survey, please improve the junction', 'Waterlogging in rains makes crossing worse', 'Street light is not working']
};
function draw(pool, used, themes){const t = themes[pick(themes.map(() => 1))]; const opts = pool[t].map(x => [x, used.get(x) || 0]); const min = Math.min(...opts.map(o => o[1])); const c = opts.filter(o => o[1] === min); const x = c[Math.floor(R() * c.length)][0]; used.set(x, (used.get(x) || 0) + 1); return x;}

/* ---------- Form A: IPT operators ---------- */
function operator(u, used){
  const r = {site: u ? 'U2' : 'U1', arm: chance(.97) ? (u ? pick([38, 37, 25]) : pick([29, 27, 23, 21])) : null};
  r.A1 = pick(u ? [27, 31, 30, 4, 7, 1] : [36, 22, 27, 5, 8, 1.6]);
  if (r.A1 === 5) r.A1x = ['Tata Magic', 'Cycle rickshaw', 'Tata Magic'][pick([1, 1, 1])];
  const sharedVeh = r.A1 === 1 || r.A1 === 2;
  r.A2 = pick([[9, 61, 9, 21], [82, 6, 0, 12], [63, 20, 0, 17], [0, 62, 18, 20], [0, 7, 79, 14], [60, 20, 0, 20]][r.A1]);
  const shared = r.A2 === 0 ? 1 : r.A2 === 3 ? .4 : 0;
  r.A3 = r.A1 === 2 ? pick([16, 41, 27, 11, 5]) : pick([7, 27, 27, 22, 17]);
  r.A4 = pick([5, 16, 34, 31, 14]);
  r.A5 = pick([[48, 46, 6], [40, 56, 4], [52, 45, 3], [45, 25, 30], [42, 20, 38], [50, 50, 0]][r.A1]);
  const p = norm() + .3 * shared - .15 + .5 * u - .12 * (r.A3 >= 3);          // tendency to stop in an obstructive way
  const w = norm() + .85 * shared - .42 - .4 * (r.A1 === 3 || r.A1 === 4);      // seat-filling pressure
  const stand = pick(u ? [9, 73, 18] : [18, 61, 21]);
  r.A20 = ord(unit([[.35, stand === 1 ? .7 : -.7], [.2, p]], 1), [4, 10, 18, 42, 26]);
  const a20z = (r.A20 - 2.8) / 1.07;
  r.A6 = ord(unit([[.75, p]], .65), [3, 11, 29, 36, 21]);
  const a7 = [chance(.82), chance(.74), chance(1 / (1 + Math.exp(-(-.85 + .8 * w)))), chance(shared ? .5 : .12), chance(.46), chance(.03)];
  if (!a7.some(Boolean)) a7[0] = true;
  r.A7 = a7.map((v, i) => v ? i : -1).filter(i => i >= 0);
  if (r.A7.includes(5)) r.A7x = ['Tea break', 'Change of driver', 'Police stops us'][pick([1, 1, 1])];
  r.A8 = p > .6 ? pick(u ? [20, 15, 35, 4, 26] : [23, 18, 29, 6, 24]) : pick(u ? [28, 24, 22, 7, 19] : [30, 24, 16, 11, 19]);
  r.A9 = chance(.085) ? 4 : ord(-unit([[.6, p], [.25, (r.A8 === 2) ? 1 : -.3]], .8) - .05 - .12 * u, [21, 33, 31, 15]);
  r.A10 = chance(.17) ? 3 : ord(unit([[.6, p], [.32, a20z]], .75) + .14 * u, [53, 37, 10]);
  r.A13 = pick([[14, 44, 38, 4], [22, 50, 27, 1], [20, 45, 34, 1], [5, 28, 52, 15], [2, 14, 34, 50], [30, 50, 20, 0]][r.A1]);
  r.A14 = ord(unit([[.75, w]], .7) + .05 * u, [19, 30, 28, 16, 7]);
  r.A11 = ord(unit([[.42, w], [.28, p], [.34, [.25, .7, -.45, -1.2][r.A13]]], .78) + .12 * u, [15, 38, 27, 15, 5]);
  r.A12 = r.A1 === 4 || r.A1 === 3 ? 1 + pick([68, 24, 8]) : r.A1 === 0 ? 1 + pick([51, 33, 16]) : 1 + pick([42, 36, 16, 6]);
  r.A19 = ord(unit([[.35, p], [.28, (r.A3 - 1.9) / 1.15]], .85), [48, 38, 14]);
  r.A15 = ord(unit([[-.4, p], [.25, r.A19 - .66]], .85), [14, 28, 31, 19, 8]);
  r.A16 = shared ? pick([22, 13, 31, 34]) : pick([33, 16, 18, 33]);
  const dz = (r.A11 - 1.66) / 1.07, lane = r.A10 === 1 || r.A10 === 2 ? 1 : 0;
  r.A17 = ord(unit([[.42, dz], [.28, 2 * lane - 1], [.2, p]], .85) + .12 * u, [11, 31, 33, 18, 7]);
  r.A18 = ord(unit([[.36, dz], [.28, 2 * lane - 1], [.22, p]], .85) + .18 * u, [12, 30, 28, 23, 7]);
  r.A21 = stand;
  r.A22 = ord(unit([[.34, a20z], [.16, r.A19 - .66], [-.34, 2 * shared - 1], [-.14, r.A5 === 1 ? 1 : -1]], .85) + .04, [10, 17, 19, 34, 20]);
  const supz = (r.A22 - 2.37) / 1.25;
  r.A23 = ord(unit([[.36, supz], [-.15, w]], .9) - .05 * u, [14, 31, 28, 18, 9]);
  r.A24 = r.A22 >= 3 ? pick([45, 19, 10, 10, 14, 2]) : pick([28, 13, 6, 19, 30, 4]);
  if (r.A24 === 5) r.A24x = ['Remove parking', 'Widen the road', 'Separate lane for e-rickshaw', 'Shift the bus stop'][pick([1, 1, 1, 1])];
  r.A25 = chance(.27) ? draw(TXT_A, used, r.A22 <= 1 ? ['walk', 'income', 'police', 'walk', 'space'] : r.A20 >= 3 ? ['space', 'facility', 'facility', 'other', 'walk'] : ['facility', 'police', 'other', 'income']) : '';
  return r;
}

/* ---------- Form B: road users and pedestrians ---------- */
function user(u, role, used){
  const r = {site: u ? 'U2' : 'U1', arm: chance(.95) ? (u ? pick([36, 39, 25]) : pick([28, 28, 23, 21])) : null, B1: role};
  const sess = pick([38, 24, 38]), m0 = [510, 780, 1020][sess], len = [180, 90, 180][sess], mm = m0 + Math.floor(R() * len);
  r.time = chance(.93) ? String(Math.floor(mm / 60)).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0') : '';
  r.B2 = pick(u ? [2.5, 29, 28, 19, 15, 6.5] : [3, 33, 26, 17, 14, 7]);
  r.B3 = chance(.016) ? null : pick([56, 41, .5, 2.5]);
  r.B4 = r.B2 <= 1 ? pick([17, 49, 12, 7, 11, 4]) : r.B2 === 5 ? pick([8, 0, 24, 42, 18, 8]) : pick([53, 5, 16, 12, 9, 5]);
  if (r.B4 === 5) r.B4x = ['Bank work', 'Temple visit', 'Government office', 'Picking up child', 'Coaching class'][pick([1, 1, 1, 1, 1])];
  r.B5 = pick(r.B4 <= 1 ? [1, 5, 11, 27, 56] : [4, 25, 22, 20, 29]);
  const fem = r.B3 === 1 ? 1 : 0, old = r.B2 >= 4 ? 1 : 0, ped = role === 0 ? 1 : 0, ipt = role === 1 || role === 2;
  r.BR = role;                                                             // routing check repeats Q1
  if (chance(.02)) r.BR = pick([0, 1, 2, 3].map(i => i === role ? 0 : 1));
  const k = norm() - .12 + .62 * u + .12 * fem + .14 * ped + .1 * old;          // exposure to conflict at the junction
  if (ipt && (r.BR === 1 || r.BR === 2)) {
    r.B6 = pick(u ? [24, 34, 31, 3, 8] : [31, 27, 30, 4, 8]);
    r.B7 = pick(u ? [31, 21, 30, 9, 9] : [32, 24, 23, 15, 6]);
    r.B8 = role === 2 ? pick([20, 14, 18, 40, 6, 2]) : pick([40, 21, 22, 4, 9, 4]);
    if (r.B8 === 5) r.B8x = ['Shade at that place', 'Always get auto there'][pick([1, 1])];
    r.B9 = pick(u ? [23, 43, 21, 10, 3] : [17, 40, 25, 13, 5]);
    r.B10 = pick(u ? [12, 31, 27, 15, 6, 9] : [15, 34, 25, 11, 4, 11]);
    r.B11 = r.B7 === 4 ? pick([2, 38, 54, 6]) : r.B7 === 3 ? pick([78, 13, 2, 7]) : pick(u ? [34, 39, 14, 13] : [44, 33, 9, 14]);
  }
  r.B12 = chance([.92, .62, .84, .3][role]) ? 0 : 1;
  const between = chance(1 / (1 + Math.exp(-(-1.05 + .5 * k - .45 * old + .3 * (r.B2 <= 1) + .12 * u))));
  r.B13 = between ? 2 : pick(u ? [20, 60, 0, 20] : [33, 52, 0, 15]);
  r.B14 = ord(unit([[.72, k], [.2, old]], .68), [7, 21, 37, 26, 9]);
  r.B15 = ord(unit([[.68, k]], .73), [7, 18, 34, 29, 12]);
  const bz = (r.B15 - 2.28) / 1.08;
  r.B16 = ord(unit([[.42, k], [.22, bz], [.26, between ? 1 : -.5]], .76) - .05, [38, 31, 23, 8]);
  r.B17 = pick([17, 20, 14, 24 + 7 * Math.max(-2, r.B15 - 2), 10, 3]);
  if (r.B17 === 5) r.B17x = ['Wrong-side riders', 'Two-wheelers', 'Trucks'][pick([1, 1, 1])];
  r.B18 = ord(unit([[.3, bz], [.42, k], [.16, 2 * fem - 1]], .74), [7, 23, 33, 27, 10]);
  r.B19 = ord(unit([[.3, k], [.18, sess === 1 ? -1.4 : .6]], .9) + .2 * u, [9, 32, 36, 18, 5]);
  const cw = [58, 36 + 6 * u + 11 * Math.max(-2, r.B15 - 2), 15, 13, 28, 0, 31]; const c1 = pick(cw), c2 = pick(cw.map((v, i) => i === c1 ? 0 : v));
  r.B20 = [c1, c2].sort((a, b) => a - b);
  const iptCause = r.B20.includes(1);
  r.B21 = chance(.085) ? 4 : ord(unit([[.42, iptCause ? 1 : -.8], [.22, bz]], .85), [11, 29, 37, 23]);
  r.B22 = pick([[58, 10, 32], [39, 14, 47], [42, 12, 46], [62, 9, 29]][role]);
  r.B23 = ord(unit([[-.24, old ? 1.4 : -.4], [-.18, fem ? .7 : -.5], [.3, r.B22 === 0 ? .8 : r.B22 === 1 ? -1.1 : -.2], [-.1, ipt ? .6 : -.5]], .88), [19, 35, 34, 12]);
  const b24 = [chance(.46 + .06 * ped + .03 * (r.B14 - 2)), chance(.4 + .05 * ipt), chance(.2 + .05 * (r.B15 - 2)), chance(.35), chance(.34 + .06 * ped), chance(.03)];
  if (!b24.some(Boolean)) b24[pick([5, 4, 2, 3, 3])] = true;
  r.B24 = b24.map((v, i) => v ? i : -1).filter(i => i >= 0);
  if (r.B24.includes(5)) r.B24x = ['Street lights', 'Flyover', 'Drainage'][pick([1, 1, 1])];
  r.B25 = chance(.17) ? draw(TXT_B, used, r.B15 >= 3 ? ['ipt', 'ipt', 'crossing', 'path', 'bay'] : r.B14 >= 3 ? ['crossing', 'control', 'path'] : ['control', 'bay', 'path', 'other', 'crossing']) : '';
  return r;
}

/* ---------- assemble ---------- */
function makeSet(u, seed, nA, noA, nB, noB){
  R = rng(seed);
  const usedA = new Map(), usedB = new Map();
  const A = Array.from({length: nA + noA}, () => operator(u, usedA));
  // Form B quota by road-user type (Q1), so both sites together clear 150 IPT users and 150 pedestrians
  const share = u ? [.35, .37, .1, .18] : [.36, .35, .08, .21], roles = [];
  share.forEach((s, i) => {for (let j = 0; j < Math.round(s * (nB + noB)); j++) roles.push(i);});
  while (roles.length < nB + noB) roles.push(0); roles.length = nB + noB; shuffle(roles);
  const B = roles.map(role => user(u, role, usedB));
  const mark = (rows, no, f) => {const idx = shuffle(rows.map((_, i) => i)).slice(0, no); rows.forEach((r, i) => {r.consent = idx.includes(i) ? 1 : 0; r.rid = `SIM-${u ? 'U2' : 'U1'}-${f}-${String(i + 1).padStart(3, '0')}`;});};
  mark(A, noA, 'A'); mark(B, noB, 'B');
  B.forEach((r, i) => {r.form = String(i + 1);});
  return {A, B};
}
const S1 = makeSet(0, 25211051, 115, 3, 225, 6);
const S2 = makeSet(1, 25211102, 115, 4, 225, 4);

/* ---------- CSV ---------- */
const q = s => {s = s == null ? '' : String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;};
function csv(rows, Q){
  const head = ['Record ID', 'Data origin', 'Site code', 'Arm / location']; if (Q === QB) head.push('Form No.', 'Time (HH:MM)');
  const cols = []; Q.forEach(x => {cols.push([x, 0]); head.push((x.n ? x.n + '. ' : '') + x.t); if (x.x) {cols.push([x, 1]); head.push(`If “Other”, please specify (Q${x.n})`);}});
  head.push('I understand this survey is for academic research and participation is voluntary.');
  const arms = ['N — North', 'S — South', 'E — East', 'W — West'];
  const lines = rows.map(r => {const o = [r.rid, 'SIMULATED', r.site + ' — Unsignalised', r.arm == null ? '' : arms[r.arm]]; if (Q === QB) o.push(r.form, r.time);
    cols.forEach(([x, other]) => {const v = r[x.id]; o.push(other ? (r[x.id + 'x'] || '') : x.multi ? (v || []).map(i => x.o[i]).join(', ') : x.num || x.txt ? (v ?? '') : v == null ? '' : x.o[v]);});
    o.push(r.consent ? 'No — I do not agree' : 'Yes — I agree'); return o.map(q).join(',');});
  return '﻿' + [head.map(q).join(','), ...lines].join('\r\n') + '\r\n';
}
for (const [name, rows, Q] of [['set1_U1_formA', S1.A, QA], ['set1_U1_formB', S1.B, QB], ['set2_U2_formA', S2.A, QA], ['set2_U2_formB', S2.B, QB]]) fs.writeFileSync(path.join(here, name + '_SIMULATED.csv'), csv(rows, Q));

/* ---------- embed ---------- */
const keys = (Q, extra) => [...extra, ...Q.flatMap(x => x.x ? [x.id, x.id + 'x'] : [x.id])];
const KA = keys(QA, ['rid', 'site', 'arm', 'consent']), KB = keys(QB, ['rid', 'site', 'arm', 'consent', 'form', 'time']);
const pack = (rows, K) => rows.map(r => K.map(k => {const v = r[k]; return v === undefined || v === '' ? null : v;}));
const body = JSON.stringify({KA, KB, U1: {A: pack(S1.A, KA), B: pack(S1.B, KB)}, U2: {A: pack(S2.A, KA), B: pack(S2.B, KB)}}).replace(/\],\[/g, '],\n[');
fs.writeFileSync(path.join(here, '..', 'src', 'data', 'sets.json'), body + '\n');
console.log(`Set 1 (U1): A ${S1.A.length}, B ${S1.B.length}. Set 2 (U2): A ${S2.A.length}, B ${S2.B.length}. Packed ${(body.length / 1024).toFixed(0)} KB.`);

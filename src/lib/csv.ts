// Google Forms CSV import and export.
import { ARMS, QA, QB, type Question } from './questions.ts';
import { has, type Form, type Row, type Site } from './survey.ts';

export function parseCSV(text: string): string[][] {
  const t = text.replace(/^﻿/, ''), rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}
const norm = (s: string) => String(s).replace(/[–—−]/g, '-').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
const english = (s: string) => norm(String(s).split('|')[0]);
function matchOption(q: Question, cell: string): number {
  const c = english(cell), lists = [q.o ?? [], q.m ?? []];
  if (/^\d+$/.test(c) && +c >= 1 && +c <= q.o!.length) return +c - 1;
  for (const L of lists) { const i = L.findIndex((o) => english(o) === c); if (i >= 0) return i; }
  let best = -1, len = 0;
  lists.forEach((L) => L.forEach((o, i) => { const x = norm(o); if (norm(cell).includes(x) && x.length > len) { best = i; len = x.length; } }));
  return best;
}
const qNumber = (h: string) => { const m = /^\s*(\d{1,2})\.\s/.exec(h); return m ? +m[1] : null; };

export interface ImportResult { ok: boolean; rows: Row[]; matched: number; total: number; messages: { level: 'info' | 'warn' | 'error'; text: string }[] }
export function importCSV(text: string, form: Form, forceSite: Site | ''): ImportResult {
  const Q = form === 'A' ? QA : QB, R = parseCSV(text);
  const fail = (t: string, matched = 0): ImportResult => ({ ok: false, rows: [], matched, total: Q.length, messages: [{ level: 'error', text: t }] });
  if (R.length < 2) return fail('No rows found in this file.');
  const H = R[0], map: Record<string, number> = {}, used = new Set<number>();
  Q.forEach((q) => {
    let j = H.findIndex((h, k) => !used.has(k) && qNumber(h) === (q.n ?? null) && q.h.test(h));
    if (j < 0) j = H.findIndex((h, k) => !used.has(k) && qNumber(h) == null && q.h.test(h));
    if (j >= 0) { map[q.id] = j; used.add(j); }
  });
  const matched = Object.keys(map).length;
  if (matched < 5) return fail(`This does not look like a Form ${form} export: only ${matched} of ${Q.length} questions matched. Nothing was imported.`, matched);
  const find = (re: RegExp) => H.findIndex((h) => re.test(h));
  const col = { site: find(/site code/i), arm: find(/^\s*arm\b/i), consent: find(/voluntary/i), form: find(/form no/i), time: find(/^\s*time\b/i), origin: find(/data origin/i), id: find(/record id/i) };
  const others: [number, number | null][] = [];
  let last: number | null = null;
  H.forEach((h, j) => { const n = qNumber(h); if (n) last = n; if (/if .?other.?.*specify/i.test(h)) { const mm = /\(Q(\d+)\)/.exec(h); others.push([j, mm ? +mm[1] : last]); } });
  let noSite = 0, signalised = 0;
  const rows = R.slice(1).map((r) => {
    const o: Row = {}, get = (j: number) => (j < 0 ? '' : (r[j] ?? '').trim());
    Q.forEach((q) => {
      const j = map[q.id];
      if (j == null) return;
      const cell = get(j);
      if (!cell) return;
      if (q.multi) o[q.id] = /^[\d;, ]+$/.test(cell) ? cell.split(/[;, ]+/).filter(Boolean).map((v) => +v - 1).filter((i) => i >= 0 && i < q.o!.length) : q.o!.map((op, i) => (norm(cell).includes(norm(op)) ? i : -1)).filter((i) => i >= 0);
      else if (q.num) { const v = parseFloat(cell); if (Number.isFinite(v)) o[q.id] = v; }
      else if (q.txt) o[q.id] = cell;
      else { const i = matchOption(q, cell); if (i >= 0) o[q.id] = i; }
    });
    others.forEach(([j, n]) => { const q = Q.find((x) => x.n === n && x.x); if (q && get(j)) o[`${q.id}x`] = get(j); });
    const s = get(col.site), site: Site | null = forceSite || (/u\s*-?\s*1/i.test(s) ? 'U1' : /u\s*-?\s*2/i.test(s) ? 'U2' : null);
    if (site) o.site = site; else if (/^s\b/i.test(s)) signalised++; else noSite++;
    const arm = ARMS.findIndex((a) => get(col.arm).toLowerCase().includes(a.toLowerCase()));
    if (arm >= 0) o.arm = arm;
    o.consent = /^\s*no\b/i.test(get(col.consent)) ? 1 : 0;
    if (get(col.form)) o.form = get(col.form);
    if (get(col.time)) o.time = get(col.time);
    if (get(col.id)) o.rid = get(col.id);
    if (/simulated/i.test(get(col.origin))) o.sim = 1;
    return o;
  });
  const messages: ImportResult['messages'] = [];
  const missing = Q.filter((q) => map[q.id] == null && !q.hide), declined = rows.filter((r) => r.consent === 1).length;
  if (declined) messages.push({ level: 'info', text: `${declined} declined consent and are left out of the analysis.` });
  if (missing.length) messages.push({ level: 'warn', text: `Not in this file: ${missing.map((q) => `Q${q.n}`).join(', ')}.` });
  if (form === 'A' && map.A15 == null && H.some((h) => /waiting at red/i.test(h))) messages.push({ level: 'info', text: 'Q15 in this file is the red-signal question, which does not apply at unsignalised sites.' });
  if (noSite) messages.push({ level: 'warn', text: `${noSite} rows have no U1 or U2 code. Choose a site and import again to assign one.` });
  if (signalised) messages.push({ level: 'warn', text: `${signalised} rows are from a signalised site, outside the present study.` });
  return { ok: true, rows, matched, total: Q.length, messages };
}

const quote = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function exportCSV(rows: Row[], form: Form, simulated: boolean): string {
  const Q = form === 'A' ? QA : QB, head = ['Record ID', 'Data origin', 'Site code', 'Arm / location'];
  if (form === 'B') head.push('Form No.', 'Time (HH:MM)');
  Q.forEach((q) => { head.push((q.n ? `${q.n}. ` : '') + q.t); if (q.x) head.push(`If “Other”, please specify (Q${q.n})`); });
  head.push('I understand this survey is for academic research and participation is voluntary.');
  const lines = rows.map((r) => {
    const o: unknown[] = [r.rid ?? '', simulated || r.sim ? 'SIMULATED' : '', r.site ?? '', has(r.arm) ? ARMS[r.arm!] : ''];
    if (form === 'B') o.push(r.form ?? '', r.time ?? '');
    Q.forEach((q) => { o.push(answerText(q, r)); if (q.x) o.push(r[`${q.id}x`] ?? ''); });
    o.push(r.consent === 1 ? 'No — I do not agree' : 'Yes — I agree');
    return o.map(quote).join(',');
  });
  return `﻿${[head.map(quote).join(','), ...lines].join('\r\n')}`;
}
export function answerText(q: Question, r: Row): string {
  const v = r[q.id];
  if (q.multi) return ((v as number[]) ?? []).map((i) => q.o![i]).join(', ');
  if (q.num || q.txt) return v == null ? '' : String(v);
  return has(v) ? q.o![v] : '';
}
export function downloadText(name: string, text: string, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

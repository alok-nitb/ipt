import { Search } from 'lucide-react';
import { useState } from 'react';
import { HBars, type Bar } from '@/components/charts/bars';
import { ChartCard } from '@/components/panels/parts';
import { barTable, questionBars } from '@/components/panels/sections';
import { Badge } from '@/components/ui/badge';
import { Input, Tabs, TabsList, TabsTrigger } from '@/components/ui/controls';
import { useApp } from '@/state/app-state';
import { QA, QB, SECTIONS_A, SECTIONS_B, type Question } from '@/lib/questions';
import { commentThemes, isIPT, type Analysis, type Form, type Row } from '@/lib/survey';
import { num, pct } from '@/lib/format';
import { NoData, PageHeader } from './section-page';

function headline(id: string, a: Analysis): string | null {
  const m = a.m, t: Record<string, string> = {
    A9: `Within 50 m: ${pct(m.within50.p)}`, A10: `Partly or fully in the lane: ${pct(m.inLane.p)}`, A11: `Mean ${num(m.dwell, 0)} s, 85th percentile ${num(m.p85, 0)} s`, A13: `Digital payment: ${pct(m.digital.p)}`, A14: `30 s or more: ${pct(m.wait30.p)}`, A15: `Often or always: ${pct(m.shift.p)}`,
    A18: `Queue behind: ${pct(m.queue.p)}`, A22: `Support or strongly support: ${pct(m.sup.p)}`, A23: `Acceptable to ${a.level}%: up to ${a.offA ?? '–'} m`,
    B13: `Between vehicles: ${pct(m.between.p)}`, B14: `Difficult or very difficult: ${pct(m.difficult.p)}`, B15: `Often or always: ${pct(m.blocked.p)}`, B16: `Sometimes or often: ${pct(m.nearMiss.p)}`, B18: `Unsafe or very unsafe: ${pct(m.unsafe.p)}`, B23: `Acceptable to ${a.level}%: up to ${a.offB ?? '–'} m`,
  };
  return t[id] ?? null;
}
function QuestionCard({ q, rows, form, a }: { q: Question; rows: Row[]; form: Form; a: Analysis }) {
  const title = <><span className="text-muted-foreground">Q{q.n}</span> {q.s}</>;
  if (q.num) {
    const v = rows.map((r) => Number(r[q.id])).filter((z) => Number.isFinite(z) && z > 0), by = [1, 2, 3, 4].map((k): Bar => ({ label: k === 4 ? '4 or more' : String(k), value: v.length ? v.filter((z) => (k === 4 ? z >= 4 : z === k)).length / v.length : 0, k: v.filter((z) => (k === 4 ? z >= 4 : z === k)).length, n: v.length }));
    return <ChartCard badge="footer" title={title} note={q.t} sim={a.sim} table={barTable(by, 'Persons')}><HBars data={by} compact /><p className="mt-3 text-[13px] font-medium">Mean {v.length ? num(v.reduce((x, y) => x + y, 0) / v.length, 2) : '–'} persons per stop</p></ChartCard>;
  }
  if (q.txt) {
    const t = commentThemes(rows, form), bars: Bar[] = t.list.map(([label, k]) => ({ label, value: k / t.n, k, n: t.n }));
    return (
      <ChartCard badge="footer" title={title} note={q.t} sim={a.sim} table={t.n ? barTable(bars, 'Theme') : undefined} className="md:col-span-2">
        {t.n ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div><HBars data={bars} compact /><p className="mt-3 text-xs text-muted-foreground">{t.n} comments; themes are assigned by keyword.</p></div>
            <ul className="flex flex-col gap-2">{t.quotes.slice(0, 6).map((s) => <li key={s} className="rounded-lg bg-muted px-3 py-2 text-[13px]">“{s}”</li>)}</ul>
          </div>
        ) : <p className="text-sm text-muted-foreground">No comments.</p>}
      </ChartCard>
    );
  }
  const bars = questionBars(q, rows), h = headline(q.id, a), n = bars[0]?.n ?? 0;
  return (
    <ChartCard badge="footer" title={title} note={q.t} sim={a.sim} table={barTable(bars)}>
      {n ? <HBars data={bars} compact /> : <p className="text-sm text-muted-foreground">No answers in this set.</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">{h && n > 0 && <span className="font-medium">{h}</span>}<span className="text-muted-foreground">n {n}{q.multi ? ', several answers' : ''}</span></div>
      {q.note && <p className="mt-1 text-xs text-muted-foreground">{q.note}</p>}
    </ChartCard>
  );
}
export function FormPage({ form }: { form: Form }) {
  const { analysis: a } = useApp(), [sec, setSec] = useState('all'), [find, setFind] = useState('');
  const Q = form === 'A' ? QA : QB, names = form === 'A' ? SECTIONS_A : SECTIONS_B, rows = form === 'A' ? a.A : a.B, needle = find.trim().toLowerCase();
  const shown = Q.filter((q) => !q.hide && (sec === 'all' || q.sec === sec) && (!needle || `q${q.n} ${q.s} ${q.t} ${(q.o ?? []).join(' ')}`.toLowerCase().includes(needle)));
  return (
    <>
      <PageHeader route={form === 'A' ? 'form-a' : 'form-b'} actions={<label className="relative w-64 max-w-full"><span className="sr-only">Search questions</span><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search questions" value={find} onChange={(e) => setFind(e.target.value)} /></label>} />
      {!rows.length ? <NoData /> : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={sec} onValueChange={setSec} className="max-w-full overflow-x-auto"><TabsList><TabsTrigger value="all">All</TabsTrigger>{Object.entries(names).map(([k, t]) => <TabsTrigger key={k} value={k}>{t}</TabsTrigger>)}</TabsList></Tabs>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2.5 rounded-[3px] bg-adverse" />Answers that point to obstruction, risk or delay</span>
          </div>
          {Object.entries(names).map(([k, t]) => {
            const qs = shown.filter((q) => q.sec === k);
            if (!qs.length) return null;
            return (
              <section key={k} className="mb-8">
                <div className="mb-3 flex items-center gap-2"><h2 className="text-lg font-semibold">{t}</h2>{form === 'B' && k === 'B' && <Badge>IPT passengers and transfers, n {a.BI.length}</Badge>}</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{qs.map((q) => <QuestionCard key={q.id} q={q} rows={q.ipt ? rows.filter(isIPT) : rows} form={form} a={a} />)}</div>
              </section>
            );
          })}
          {!shown.length && <p className="py-10 text-center text-sm text-muted-foreground">No question matches “{find}”.</p>}
        </>
      )}
    </>
  );
}

import type { ReactNode } from 'react';
import { CircleAlert, Gauge, Hourglass, MapPin, ShieldAlert, ThumbsUp, TrafficCone, type LucideIcon } from 'lucide-react';
import { AcceptanceCurve } from '@/components/charts/curve';
import { CiStrip, Diverging, HBars, type Bar, type DivRow } from '@/components/charts/bars';
import { Dumbbell } from '@/components/charts/dumbbell';
import { flowData, OutcomeFlow } from '@/components/charts/flow';
import { Forest } from '@/components/charts/forest';
import { crossTab, Heatmap } from '@/components/charts/heatmap';
import { DwellHistogram } from '@/components/charts/histogram';
import { Pictogram } from '@/components/charts/pictogram';
import { RoadStrip } from '@/components/charts/road-strip';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress, Slider } from '@/components/ui/controls';
import { useApp } from '@/state/app-state';
import type { Route } from '@/state/use-route';
import { QSA, QSB, type Question } from '@/lib/questions';
import { acceptance, BAY_A, BAY_B, describeModel, dist, isIn, isIPT, meanDwellBy, prop, SOURCE_NAME, TARGET, topAnswer, type Analysis, type Row } from '@/lib/survey';
import type { LogitFit, Proportion } from '@/lib/stats';
import { listOf, lower, num, pct, pText } from '@/lib/format';
import { ChartCard, DataTable, DCrit, Grid, PageOnly, Readings, RichText, usePresenting, type TableData } from './parts';

export interface Section { id: string; page: Route; eyebrow: string; title: string; sub?: string; body: ReactNode }

/* ---------- helpers ---------- */
export function questionBars(q: Question, rows: Row[], o: { rank?: boolean; tone?: Bar['tone']; plain?: boolean } = {}): Bar[] {
  const d = dist(rows, q);
  const bars = q.o!.map((label, i) => ({ label, value: d.n ? d.counts[i] / d.n : 0, k: d.counts[i], n: d.n, tone: o.tone ?? (!o.plain && q.bad?.includes(i) ? 'adverse' : 'data') }) as Bar);
  return o.rank ? bars.sort((a, b) => Number(/^other$/i.test(a.label)) - Number(/^other$/i.test(b.label)) || b.value - a.value) : bars;
}
export const barTable = (bars: Bar[], head = 'Answer'): TableData => ({ head: [head, 'Count', 'n', 'Share'], rows: bars.map((b) => [b.label, b.k ?? '–', b.n ?? '–', b.display ?? pct(b.value, 1)]) });
function groupBars(rows: Row[], q: Question, test: (r: Row) => boolean | null, min = 3, tone: Bar['tone'] = 'data'): Bar[] {
  return q.o!.map((label, i) => ({ label, ...prop(rows.filter((r) => r[q.id] === i), test) })).filter((x) => x.n >= min).map((x) => ({ label: x.label, value: x.p ?? 0, k: x.k, n: x.n, lo: x.lo, hi: x.hi, tone }));
}
const CODES = { five: [[4, 'a2'], [3, 'a1'], [2, 'm'], [1, 'f1'], [0, 'f2']], near: [[3, 'a2'], [2, 'a1'], [1, 'f1'], [0, 'f2']], support: [[0, 'a2'], [1, 'a1'], [2, 'm'], [3, 'f1'], [4, 'f2']], use: [[1, 'a2'], [2, 'm'], [0, 'f2']] } as const;
function divRow(label: string, rows: Row[], q: Question, codes: readonly (readonly [number, DivRow['parts'][number]['c']])[]): DivRow {
  const d = dist(rows, q);
  return { label, n: d.n, parts: codes.map(([i, c]) => ({ label: q.o![i], p: d.n ? d.counts[i] / d.n : 0, c })) };
}
const divTable = (rows: DivRow[]): TableData => ({ head: ['', 'n', ...rows[0].parts.map((_, i) => ['Lowest', '2', '3', '4', '5'][i] ?? '')], rows: rows.map((r) => [r.label, r.n, ...r.parts.map((p) => `${p.label} ${pct(p.p)}`)]) });
const CiNote = ({ extra }: { extra?: string }) => <p className="mt-3 text-xs text-muted-foreground">Thin line: 95% confidence interval.{extra && ` ${extra}`}</p>;
const RedNote = ({ children }: { children: ReactNode }) => <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2.5 rounded-[3px] bg-adverse" />{children}</p>;

/* ---------- KPI ---------- */
function Kpi({ icon: Icon, label, value, note, p }: { icon: LucideIcon; label: string; value: string; note?: string; p?: Proportion }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2"><span className="min-h-9 text-[13px] leading-snug text-muted-foreground">{label}</span><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-4" /></span></div>
      <span className="mt-1 text-[28px] leading-tight font-semibold tracking-tight">{value}</span>
      <span className="mt-auto pt-1 text-xs text-muted-foreground">{note}{p?.lo != null && `${note ? '; ' : ''}95% CI ${Math.round(100 * p.lo)}–${Math.round(100 * p.hi!)}%`}</span>
      {p?.p != null && p.lo != null && p.hi != null && <CiStrip p={p.p} lo={p.lo} hi={p.hi} />}
    </Card>
  );
}
export function KpiRow({ a }: { a: Analysis }) {
  const m = a.m;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Kpi icon={MapPin} label="Acceptable bay offset" value={a.offset != null ? `${a.offset} m` : '–'} note={`to ${a.level}% of both groups`} />
      <Kpi icon={TrafficCone} label="High-obstruction operators" value={pct(m.ho.p)} p={m.ho} />
      <Kpi icon={Hourglass} label="Mean stated stop" value={m.dwell != null ? `${num(m.dwell, 0)} s` : '–'} note={m.p85 != null ? `85th percentile ${num(m.p85, 0)} s` : ''} />
      <Kpi icon={Gauge} label="Report a queue behind" value={pct(m.queue.p)} p={m.queue} />
      <Kpi icon={ThumbsUp} label="Support the bay rule" value={pct(m.sup.p)} p={m.sup} />
      <Kpi icon={ShieldAlert} label="Feel unsafe on foot" value={pct(m.unsafe.p)} p={m.unsafe} />
    </div>
  );
}
export function SampleCard({ a }: { a: Analysis }) {
  const m = a.m, s = a.single, rows: [string, number, number][] = [
    [`Form A, operators${s ? ', this site' : ''}`, m.nA, s ? TARGET.siteA : TARGET.A], [`Form B, road users${s ? ', both sites' : ''}`, m.nB, TARGET.B],
    [`Form B, IPT users${s ? ', both sites' : ''}`, m.nI, TARGET.group], [`Form B, pedestrians${s ? ', both sites' : ''}`, m.nP, TARGET.group],
  ];
  return (
    <ChartCard badge="footer" title="Sample against target" sim={a.sim} note={`${a.raw.A.length} + ${a.raw.B.length} responses received${a.declinedA + a.declinedB ? `; ${a.declinedA} + ${a.declinedB} declined consent and are left out` : ''}`}>
      <div className="flex flex-col gap-4 pt-1">
        {rows.map(([t, v, g]) => (
          <div key={t}><div className="mb-1.5 flex justify-between gap-3 text-[13px]"><span>{t}</span><span className="tnum text-muted-foreground"><b className="font-semibold text-foreground">{v}</b> of {g}</span></div><Progress value={(100 * v) / g} /></div>
        ))}
      </div>
    </ChartCard>
  );
}
function LevelControl() {
  const { level, setLevel } = useApp(), presenting = usePresenting();
  if (presenting) return null;
  return (
    <div className="mt-2 flex items-center gap-4 rounded-lg bg-muted px-4 py-2.5 text-[13px]">
      <span className="shrink-0">Acceptance level</span><Slider label="Acceptance level" min={50} max={95} step={5} value={[level]} onValueChange={([v]) => setLevel(v)} /><b className="tnum w-10 shrink-0 text-right font-semibold">{level}%</b>
    </div>
  );
}
function ModelNote({ fit, extra }: { fit: LogitFit; extra?: string }) {
  return <p className="mt-3 text-xs text-muted-foreground">n {fit.n}, likelihood-ratio {pText(fit.p)}, McFadden R² {num(fit.r2, 2)}, {pct(fit.accuracy)} classified correctly (baseline {pct(fit.baseline)}), {num(fit.epv, 0)} events per predictor{fit.epv < 10 ? ': below 10, so indicative only' : ''}.{extra && ` ${extra}`}</p>;
}
export function ConclusionList({ a }: { a: Analysis }) {
  return (
    <Card className="p-2">
      <ol className="grid gap-x-6 lg:grid-cols-2">
        {a.conclusions.map((c, i) => (
          <li key={c.lead} className="flex gap-3 p-3 text-sm">
            <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
            <div><div className="mb-0.5 flex flex-wrap items-center gap-2"><b className="font-semibold">{c.lead}</b><Badge variant="outline">{c.tag}</Badge></div><RichText text={c.text} /></div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ---------- all result sections, in presentation order ---------- */
export function buildSections(a: Analysis): Section[] {
  const { A, B, m, tests: T, sim } = a, S: Section[] = [], n = `n ${m.nA}`;
  const site = a.single ? (a.source as 'U1' | 'U2') : undefined;
  if (!m.nA && !m.nB) return S;

  S.push({
    id: 'key', page: 'overview', eyebrow: 'Key figures', title: `${m.nA} operators and ${m.nB} road users`, sub: `${SOURCE_NAME[a.source]}.`,
    body: <div className="flex flex-col gap-4"><KpiRow a={a} />{m.nA > 0 && <ChartCard sim={sim} title="Where operators stop, seen on one approach" note="Form A Q9 and Q10, drawn to scale along the road"><RoadStrip rows={A} site={site} offset={a.offset} /></ChartCard>}</div>,
  });
  if (m.nA) {
    const { R, C, M, n: hn } = crossTab(A), loc = questionBars(QSA.A8, A, { rank: true });
    S.push({
      id: 'where', page: 'stopping', eyebrow: 'Objective 1 · Where', title: `${pct(m.within50.p)} of operators stop within 50 m of the junction and ${pct(m.inLane.p)} stop in the traffic lane`, sub: `Form A Q8, Q9, Q10. ${n}`,
      body: (
        <div className="flex flex-col gap-4">
          <Grid>
            <ChartCard sim={sim} title="Stop distance and position" note="Share of operators" table={{ head: ['Distance', ...C], rows: R.map((r, i) => [r, ...M[i].map((v) => `${v} (${pct(hn ? v / hn : 0)})`)]) }}><Heatmap rows={A} /></ChartCard>
            <ChartCard sim={sim} title="Usual stop location" table={barTable(loc)}><HBars data={loc} /><RedNote>Corner, or wherever the passenger asks</RedNote></ChartCard>
          </Grid>
          <Readings items={[
            { text: <><b className="font-semibold">High-obstruction profile:</b> {pct(m.ho.p)} of operators combine a stop within 50 m, a position in the lane and a duration over 20 s.</> },
            { text: `${pct(m.noStand.p)} say there is no designated stand near the intersection.` },
          ]} />
        </div>
      ),
    });
    const fares: Bar[] = meanDwellBy(A, QSA.A13).map((x) => ({ label: x.option, value: x.mean, display: `${num(x.mean, 0)} s`, n: x.n })), dur = questionBars(QSA.A11, A);
    S.push({
      id: 'long', page: 'stopping', eyebrow: 'Objective 1 · How long', title: `A stop lasts about ${num(m.dwell, 0)} s on average, and ${pct(m.long30.p)} of operators stop for more than 30 s`, sub: `Form A Q11, Q13. Class mid-points 5, 15, 25, 45 and 75 s. ${n}`,
      body: (
        <div className="flex flex-col gap-4">
          <Grid>
            <ChartCard sim={sim} title="Usual duration of one stop" note="Area is proportional to the share; red is over 30 s" table={barTable(dur, 'Duration')}><DwellHistogram a={a} /></ChartCard>
            <ChartCard sim={sim} title="Mean stated stop by fare payment" table={{ head: ['Fare payment', 'n', 'Mean'], rows: fares.map((x) => [x.label, x.n!, x.display!]) }}><HBars data={fares} showN /></ChartCard>
          </Grid>
          <Readings items={[{ text: `Median ${num(m.median, 0)} s and 85th percentile ${num(m.p85, 0)} s, interpolated within the answer classes.` }, T.fare && { text: `Stop duration ${T.fare.sig ? 'differs' : 'does not differ significantly'} between fare methods.`, test: T.fare }]} />
        </div>
      ),
    });
    const why = questionBars(QSA.A7, A, { rank: true }), wv = groupBars(A, QSA.A1, isIn('A14', [2, 3, 4]), 5);
    S.push({
      id: 'why', page: 'stopping', eyebrow: 'Objective 1 · Passenger service', title: `${pct(m.seek.p)} of operators call, search or wait for passengers near the junction`, sub: `Form A Q7 (several answers allowed), Q14. ${n}`,
      body: (
        <div className="flex flex-col gap-4">
          <Grid>
            <ChartCard sim={sim} title="Reasons for stopping" table={barTable(why, 'Reason')}><HBars data={why} /><RedNote>Searching or waiting, so avoidable</RedNote></ChartCard>
            <ChartCard sim={sim} title="Wait 30 s or more to fill seats, by vehicle" table={barTable(wv, 'Vehicle')}><HBars data={wv} showN domainMax={1} /><CiNote extra="Types with fewer than 5 operators are left out." /></ChartCard>
          </Grid>
          <Readings items={[
            T.wait && { text: `Waiting 30 s or more ${T.wait.sig ? 'differs' : 'does not differ significantly'} between shared fixed-route and other services: ${T.wait.desc}.`, test: T.wait },
            T.waitdur && { text: T.waitdur.sig ? (T.waitdur.rho! > 0 ? 'Operators who wait longer also report longer stops.' : 'Operators who wait longer report shorter stops.') : 'Waiting time has no significant link with stop duration.', test: T.waitdur },
          ]} />
        </div>
      ),
    });
    const qd = groupBars(A, QSA.A11, isIn('A18', [3, 4])), causes = m.nB ? questionBars(QSB.B20, B, { rank: true }) : [];
    S.push({
      id: 'traffic', page: 'impact', eyebrow: 'Objective 2 · Traffic', title: `${pct(m.queue.p)} of operators report a queue behind their stop${T.durQ?.sig && T.durQ.rho! > 0 ? ', more often when stops are longer' : ''}`, sub: `Form A Q11, Q17, Q18 and Form B Q19–Q21. ${m.nA} operators, ${m.nB} road users`,
      body: (
        <div className="flex flex-col gap-4">
          <Grid>
            <ChartCard sim={sim} title="Report a queue, by stop duration" table={barTable(qd, 'Duration')}><HBars data={qd} showN domainMax={1} /><CiNote /></ChartCard>
            {m.nB > 0 && <ChartCard sim={sim} title="Road users: main causes of delay" note="Several answers" table={barTable(causes, 'Cause')}><HBars data={causes} /><RedNote>IPT stopping</RedNote></ChartCard>}
          </Grid>
          <Readings items={[
            T.durQ && { text: 'Stop duration with what happens behind.', test: T.durQ }, T.durEff && { text: 'Stop duration with the stated effect on vehicles behind.', test: T.durEff }, T.laneQ && { text: `Report a queue behind: ${T.laneQ.desc}.`, test: T.laneQ },
            m.nB > 0 && { text: `${pct(m.delay2.p)} of road users faced 2 minutes or more of delay, and ${pct(m.travelTime.p)} say IPT stopping adds moderately or significantly to their travel time.` },
          ]} />
        </div>
      ),
    });
    const fl = flowData(A), nm = Object.fromEntries(fl.nodes.map((x) => [x.id, x.label]));
    S.push({
      id: 'flow', page: 'impact', eyebrow: 'Objective 2 · From stop to queue', title: 'How stop distance and position lead to a queue', sub: `Form A Q9, Q10, Q18. n ${fl.n}`,
      body: <ChartCard sim={sim} title="Stop distance, position and what happens behind" note="Band width is the number of operators" table={{ head: ['From', 'To', 'Queue behind', 'Operators', 'Share'], rows: fl.links.map((l) => [nm[l.source], nm[l.target], l.queue ? 'yes' : 'no', l.value, pct(l.value / fl.n)]) }}><OutcomeFlow rows={A} /></ChartCard>,
    });
  }
  if (m.nB) {
    const lk = [divRow('Feeling of safety', B, QSB.B18, CODES.five), divRow('Ease of crossing', B, QSB.B14, CODES.five), divRow('Blocked by stopped IPTs', B, QSB.B15, CODES.five), divRow('Near-misses', B, QSB.B16, CODES.near)];
    const us = groupBars(B, QSB.B15, isIn('B18', [3, 4]), 3, 'adverse'), sd = dist(B, QSB.B18), share = (ix: number[]) => (sd.n ? ix.reduce((s, i) => s + sd.counts[i], 0) / sd.n : 0);
    S.push({
      id: 'ped', page: 'impact', eyebrow: 'Objective 2 · Pedestrians', title: `${pct(m.unsafe.p)} of road users feel unsafe on foot${T.blkSafe?.sig && T.blkSafe.rho! > 0 ? ', and more so where stopped IPTs block them' : ''}`, sub: `Form B Q13–Q18. n ${m.nB}`,
      body: (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard badge="footer" sim={sim} title="Of every 100 road users" note="Form B Q18" table={{ head: ['Feeling of safety', 'Share'], rows: QSB.B18.o!.map((o, i) => [o, pct(sd.n ? sd.counts[i] / sd.n : 0, 1)]) }}>
              <Pictogram label="Feeling of safety" parts={[{ label: 'feel unsafe', p: share([3, 4]), color: 'var(--c-adverse)' }, { label: 'neutral', p: share([2]), color: 'var(--c-mid)' }, { label: 'feel safe', p: share([0, 1]), color: 'var(--c-data)' }]} />
            </ChartCard>
            <ChartCard className="lg:col-span-2" sim={sim} title="Walking and crossing" table={divTable(lk)}><Diverging rows={lk} ends={['Worse', 'Better']} names={[{ c: 'a2', label: 'Worst answer' }, { c: 'a1', label: 'Poor' }, { c: 'm', label: 'Middle' }, { c: 'f1', label: 'Good' }, { c: 'f2', label: 'Best answer' }]} /></ChartCard>
          </div>
          <Grid className="lg:grid-cols-[2fr_3fr]">
            <ChartCard sim={sim} title="Feel unsafe, by how often IPTs block them" table={barTable(us, 'Blocked')}><HBars data={us} showN domainMax={1} /><CiNote /></ChartCard>
            <Readings items={[
              T.blkSafe && { text: 'Blocking by stopped IPTs with feeling unsafe.', test: T.blkSafe }, T.btwNm && { text: `Near-misses sometimes or often: ${T.btwNm.desc}. ${pct(m.between.p)} usually cross between vehicles.`, test: T.btwNm },
              T.grpSafe && { text: `Pedestrians and IPT users ${T.grpSafe.sig ? 'differ' : 'do not differ significantly'} on safety. The sample was sized to detect w = 0.30.`, test: T.grpSafe, extra: `w = ${num(T.grpSafe.w, 2)}` },
            ]} />
          </Grid>
        </div>
      ),
    });
  }
  if (a.offset != null) {
    const ds = [10, 20, 30, 40, 50, 60, 75, 100];
    S.push({
      id: 'distance', page: 'distance', eyebrow: 'Objective 3 · Critical stopping distance', title: `A bay up to ${a.offset} m from the junction is acceptable to at least ${a.level}% of ${a.offA != null && a.offB != null ? 'both groups' : a.offA != null ? 'operators' : 'road users'}`, sub: 'Form A Q23, Form B Q23. Interpolated within each answer class; the open top class is closed at 150 m.',
      body: (
        <div className="flex flex-col gap-4">
          <Grid className="lg:grid-cols-[3fr_2fr]">
            <ChartCard sim={sim} title="Who accepts a bay at each distance" table={{ head: ['Distance', 'Operators', 'Road users'], rows: ds.map((d) => [`${d} m`, pct(acceptance(A, 'A23', BAY_A, d)), pct(acceptance(B, 'B23', BAY_B, d))]) }}><AcceptanceCurve a={a} /><LevelControl /></ChartCard>
            <ChartCard sim={sim} title={<>Survey inputs for the <DCrit /> model</>}>
              <DataTable head={['Input', 'Value']} rows={[['Mean stated stop', `${num(m.dwell, 0)} s`], ['85th percentile stop', `${num(m.p85, 0)} s`], ['Usually stop within 50 m', pct(m.within50.p)], ['Often or always shift the stop in heavy traffic', pct(m.shift.p)], [`Offset acceptable to ${a.level}% of operators`, a.offA != null ? `${a.offA} m` : '–'], [`Walk acceptable to ${a.level}% of road users`, a.offB != null ? `${a.offB} m` : '–']]} />
            </ChartCard>
          </Grid>
          {m.nA > 0 && <PageOnly><ChartCard sim={sim} title="That bay against where operators stop now" note="Form A Q9 and Q10"><RoadStrip rows={A} site={site} offset={a.offset} /></ChartCard></PageOnly>}
          <Readings items={[{ text: <>The survey gives the upper limit people accept. <DCrit /> itself comes from the video data: where it exceeds this offset, a bay far enough away to protect the junction would be further than most are willing to use.</> }]} />
        </div>
      ),
    });
  }
  const ta = m.nA ? topAnswer(A, QSA.A24) : null, tb = m.nB ? topAnswer(B, QSB.B24) : null;
  if (ta || tb) {
    const pa = m.nA ? questionBars(QSA.A24, A, { rank: true }) : [], pb = m.nB ? questionBars(QSB.B24, B, { rank: true, tone: 'user' }) : [];
    S.push({
      id: 'strategies', page: 'strategies', eyebrow: 'Objective 4 · Management strategies', title: [ta && `Operators most often choose “${ta.option}”`, tb && `${ta ? 'road' : 'Road'} users most often ask for “${tb.option}”`].filter(Boolean).join('; '), sub: 'Form A Q24 (one answer), Form B Q24 (several answers), so the two charts are not on the same scale.',
      body: (
        <div className="flex flex-col gap-4">
          <Grid>
            {m.nA > 0 && <ChartCard sim={sim} title="Operators: most practical arrangement" table={barTable(pa, 'Arrangement')}><HBars data={pa} /></ChartCard>}
            {m.nB > 0 && <ChartCard sim={sim} title="Road users: most needed improvement" table={barTable(pb, 'Improvement')}><HBars data={pb} /></ChartCard>}
          </Grid>
          <Readings items={[{ text: 'These shares show which strategies (S0–S5) have support. Their traffic effect comes from the VISSIM runs.' }]} />
        </div>
      ),
    });
  }
  const sup = [divRow('All operators', A, QSA.A22, CODES.support), ...QSA.A1.o!.map((o, i) => divRow(o, A.filter((r) => r.A1 === i), QSA.A22, CODES.support)).filter((x) => x.n >= 5)];
  const use = [divRow('All road users', B, QSB.B22, CODES.use), ...QSB.B1.o!.map((o, i) => divRow(o.replace(' (driver / rider)', ''), B.filter((r) => r.B1 === i), QSB.B22, CODES.use)).filter((x) => x.n >= 5)];
  S.push({
    id: 'acceptance', page: 'acceptance', eyebrow: 'Objective 5 · Acceptance', title: [m.nA && `${pct(m.sup.p)} of operators support a designated-bay rule`, m.nB && `${pct(m.willing.p! + m.cond.p!)} of road users would use a designated point, outright or on conditions`].filter(Boolean).join(', and '), sub: 'Form A Q22, Form B Q22. Groups with fewer than 5 answers are left out.',
    body: (
      <div className="flex flex-col gap-4">
        <Grid>
          {m.nA > 0 && <ChartCard sim={sim} title="Operators: rule to stop only at a bay" table={divTable(sup)}><Diverging rows={sup} ends={['Oppose', 'Support']} names={[{ c: 'a2', label: 'Strongly oppose' }, { c: 'a1', label: 'Oppose' }, { c: 'm', label: 'Neutral' }, { c: 'f1', label: 'Support' }, { c: 'f2', label: 'Strongly support' }]} /></ChartCard>}
          {m.nB > 0 && <ChartCard sim={sim} title="Road users: would use a designated point" table={divTable(use)}><Diverging rows={use} ends={['No', 'Yes']} names={[{ c: 'a2', label: 'No' }, { c: 'm', label: 'Depends on distance and safety' }, { c: 'f2', label: 'Yes' }]} /></ChartCard>}
        </Grid>
        <Readings items={[
          T.placeSup && { text: `Agreeing that there is no proper place ${T.placeSup.sig ? (T.placeSup.rho! > 0 ? 'goes with more support' : 'goes with less support') : 'shows no significant link with support'}.`, test: T.placeSup },
          T.fineSup && { text: `Support by past fines: ${T.fineSup.desc}.`, test: T.fineSup }, T.grpUse && { text: `Pedestrians and IPT users ${T.grpUse.sig ? 'differ' : 'do not differ significantly'} on using a designated point (${T.grpUse.desc}).`, test: T.grpUse },
        ]} />
      </div>
    ),
  });
  if (a.models.support || a.models.lane) {
    const s = describeModel(a.models.support), l = describeModel(a.models.lane, true), ft = (f: LogitFit): TableData => ({ head: ['Predictor', 'B', 'SE', 'Odds ratio', '95% CI', 'p'], rows: f.rows.map((r) => [r.t, num(r.b, 3), num(r.se, 3), num(r.or, 2), `${num(r.lo, 2)}–${num(r.hi, 2)}`, r.p < 0.001 ? '< 0.001' : num(r.p, 3)]) });
    S.push({
      id: 'models', page: 'acceptance', eyebrow: 'Objectives 1 and 5 · Binary logit models', title: s ? `Support for the bay rule is ${s}` : 'No single factor is clearly linked to support for the bay rule', sub: 'Six predictors per model, as in the sample-size plan. Right of 1 means more likely. * p < 0.05, not adjusted.',
      body: (
        <div className="flex flex-col gap-4">
          <Grid>
            {a.models.support && <ChartCard sim={sim} title="Supports the bay rule (Q22)" table={ft(a.models.support)}><Forest fit={a.models.support} /><ModelNote fit={a.models.support} /></ChartCard>}
            {a.models.lane && <ChartCard sim={sim} title="Stops in the traffic lane (Q10)" table={ft(a.models.lane)}><Forest fit={a.models.lane} /><ModelNote fit={a.models.lane} extra="“Depends on space” is left out." /></ChartCard>}
          </Grid>
          <Readings items={[a.models.lane && { text: l ? `Stopping in the lane is ${l}.` : 'No single factor is clearly linked to stopping in the lane.' }, m.nA < TARGET.modelA && { text: `The plan needs at least ${TARGET.modelA} operators for these models; this selection has ${m.nA}.` }]} />
        </div>
      ),
    });
  }
  if (a.compare) {
    const c = a.compare, sg = c.rows.filter((r) => r.adj != null && r.adj < 0.05), sc = c.scales.filter((r) => r.adj != null && r.adj < 0.05);
    S.push({
      id: 'compare', page: 'compare', eyebrow: 'Site comparison', title: sg.length ? `U1 and U2 differ on ${sg.length} of ${c.rows.length} indicators` : 'No indicator differs significantly between U1 and U2', sub: `U1: ${c.a.nA} operators, ${c.a.nB} road users. U2: ${c.b.nA} operators, ${c.b.nB} road users. Chi-square tests, Holm-adjusted.`,
      body: (
        <div className="flex flex-col gap-4">
          <ChartCard sim={sim} title="Share of respondents at each site" note="Green marks adjusted p below 0.05" table={{ head: ['Indicator', 'U1', 'U2', 'Test', 'p', 'Adjusted p'], rows: c.rows.map((r) => [r.t, `${pct(r.a.p)} (${r.a.k}/${r.a.n})`, `${pct(r.b.p)} (${r.b.k}/${r.b.n})`, r.test?.stat ?? '–', num(r.p, 3), num(r.adj, 3)]) }}><Dumbbell rows={c.rows} /></ChartCard>
          <Readings items={[{ text: sc.length ? `On the full ordered scales the sites also differ on ${listOf(sc.map((r) => `${lower(r.t.replace(/ \(.*/, ''))} (adjusted ${pText(r.adj)})`))} (Mann–Whitney).` : 'On the full ordered scales no difference is significant (Mann–Whitney).' }]} />
        </div>
      ),
    });
    S.push({
      id: 'compare-road', page: 'compare', eyebrow: 'Site comparison · On the road', title: `${pct(c.b.within50.p)} stop within 50 m at U2 and ${pct(c.a.within50.p)} at U1`, sub: 'Form A Q9 and Q10. Each vehicle is 1% of operators at that site.',
      body: (
        <div className="flex flex-col gap-4">
          <ChartCard sim={sim} title="U1, four-arm junction, moderate flow"><RoadStrip rows={A.filter((r) => r.site === 'U1')} site="U1" showLegend={false} /></ChartCard>
          <ChartCard sim={sim} title="U2, T-junction, higher flow"><RoadStrip rows={A.filter((r) => r.site === 'U2')} site="U2" /></ChartCard>
        </div>
      ),
    });
  }
  S.push({
    id: 'conclusions', page: 'conclusions', eyebrow: 'Conclusions', title: 'What the responses say', sub: `${SOURCE_NAME[a.source]}. p-values are Holm-adjusted across the statistical tests.`,
    body: (
      <div className="flex flex-col gap-4">
        <ConclusionList a={a} />
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">{a.notes.map((x) => <li key={x} className="flex gap-2"><CircleAlert className="mt-0.5 size-4 shrink-0" />{x}</li>)}</ul>
      </div>
    ),
  });
  return S;
}
export { isIPT };

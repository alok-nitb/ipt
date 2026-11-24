import type { ReactNode } from 'react';
import { SimBadge } from '@/components/panels/parts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Td, Th } from '@/components/ui/controls';
import { useApp } from '@/state/app-state';
import type { LogitFit } from '@/lib/stats';
import { itemChecks, recordChecks } from '@/lib/survey';
import { num, pct, pText, pVal } from '@/lib/format';
import { NoData, PageHeader } from './section-page';

function Block({ title, text, sim, children }: { title: string; text?: ReactNode; sim: boolean; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><div><CardTitle className="text-base">{title}</CardTitle>{text && <CardDescription className="mt-1 max-w-[95ch]">{text}</CardDescription>}</div>{sim && <SimBadge />}</CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
const R = 'tnum text-right whitespace-nowrap';
function Model({ title, fit, sim }: { title: string; fit: LogitFit | null; sim: boolean }) {
  if (!fit) return null;
  return (
    <Block sim={sim} title={title} text={<>n {fit.n}, {fit.events} yes. Likelihood-ratio χ²({fit.rows.length}) = {num(fit.lr, 2)}, {pText(fit.p)}. McFadden R² {num(fit.r2, 3)}. Correctly classified {pct(fit.accuracy, 1)} (baseline {pct(fit.baseline, 1)}). Events per predictor {num(fit.epv, 1)}{fit.epv < 10 ? ' (below 10: indicative only)' : ''}.</>}>
      <Table>
        <thead><tr><Th>Predictor (yes or no)</Th>{['B', 'SE', 'Odds ratio', '95% CI', 'p'].map((h) => <Th key={h} className="text-right">{h}</Th>)}</tr></thead>
        <tbody>{fit.rows.map((r) => <tr key={r.t}><Td>{r.t}</Td><Td className={R}>{num(r.b, 3)}</Td><Td className={R}>{num(r.se, 3)}</Td><Td className={R}>{num(r.or, 2)}</Td><Td className={R}>{num(r.lo, 2)}–{num(r.hi, 2)}</Td><Td className={R}>{r.p < 0.05 ? <Badge variant="success">{pVal(r.p)}</Badge> : pVal(r.p)}</Td></tr>)}</tbody>
      </Table>
    </Block>
  );
}
const alphaText = (x: { a: number; n: number } | null) => (x ? `${num(x.a, 2)} (n ${x.n}), ${x.a >= 0.7 ? 'acceptable' : x.a >= 0.6 ? 'questionable' : 'low'}` : 'needs at least 8 complete responses');

export function TestsPage() {
  const { analysis: a } = useApp(), list = Object.values(a.tests);
  return (
    <>
      <PageHeader route="tests" />
      {!list.length ? <NoData /> : (
        <div className="flex flex-col gap-4">
          <Block sim={a.sim} title="Associations" text={<>Ordered answers: Spearman or Kruskal–Wallis. Categories: chi-square (Yates-corrected when 2 × 2). Adjusted p uses the Holm method across all {list.length} tests; significant means adjusted p below 0.05. Effect: ρ for Spearman, Cohen’s w for chi-square, ε² for Kruskal–Wallis.</>}>
            <Table>
              <thead><tr><Th>Objective</Th><Th>Questions</Th><Th>Test</Th><Th className="text-right">Result</Th><Th className="text-right">n</Th><Th className="text-right">p</Th><Th className="text-right">Adjusted p</Th><Th className="text-right">Effect</Th><Th>Reading</Th></tr></thead>
              <tbody>{list.map((t) => (
                <tr key={t.key}>
                  <Td className="whitespace-nowrap">{t.obj}</Td><Td className="whitespace-nowrap">{t.q}</Td><Td className="min-w-52">{t.name}<span className="block text-xs text-muted-foreground">{t.kind}</span></Td>
                  <Td className={R}>{t.stat}</Td><Td className={R}>{t.n}</Td><Td className={R}>{pVal(t.p)}</Td><Td className={R}>{pVal(t.adj)}</Td><Td className={R}>{num(t.eff, 2)}</Td>
                  <Td className="min-w-56"><span className="flex flex-wrap gap-1"><Badge variant={t.sig ? 'success' : 'neutral'}>{t.sig ? 'Significant' : 'Not significant'}</Badge>{(t.lowShare ?? 0) > 0.2 && <Badge variant="warning">Small expected counts</Badge>}</span>{t.desc && <span className="mt-1 block text-xs text-muted-foreground">{t.desc}</span>}</Td>
                </tr>
              ))}</tbody>
            </Table>
          </Block>
          <div className="grid gap-4 xl:grid-cols-2"><Model sim={a.sim} title="Binary logit: supports the designated-bay rule" fit={a.models.support} /><Model sim={a.sim} title="Binary logit: stops partly or fully in the lane" fit={a.models.lane} /></div>
          {a.compare && (
            <Block sim={a.sim} title="U1 and U2" text="Shares: chi-square (Yates-corrected). Ordered scales: Mann–Whitney. Holm-adjusted together.">
              <Table>
                <thead><tr><Th>Indicator</Th>{['U1', 'U2', 'Difference', 'Test', 'p', 'Adjusted p'].map((h) => <Th key={h} className="text-right">{h}</Th>)}</tr></thead>
                <tbody>
                  {a.compare.rows.map((r) => <tr key={r.key}><Td>{r.t}</Td><Td className={R}>{pct(r.a.p)} ({r.a.k}/{r.a.n})</Td><Td className={R}>{pct(r.b.p)} ({r.b.k}/{r.b.n})</Td><Td className={R}>{r.b.p! >= r.a.p! ? '+' : '−'}{num(100 * Math.abs(r.b.p! - r.a.p!), 0)} pts</Td><Td className={R}>{r.test?.stat ?? '–'}</Td><Td className={R}>{pVal(r.p)}</Td><Td className={R}>{r.adj != null && r.adj < 0.05 ? <Badge variant="success">{pVal(r.adj)}</Badge> : pVal(r.adj)}</Td></tr>)}
                  {a.compare.scales.map((r) => <tr key={r.t}><Td>{r.t}</Td><Td className={R}>–</Td><Td className={R}>–</Td><Td className={R}>–</Td><Td className={R}>{r.test?.stat ?? '–'}</Td><Td className={R}>{pVal(r.p)}</Td><Td className={R}>{r.adj != null && r.adj < 0.05 ? <Badge variant="success">{pVal(r.adj)}</Badge> : pVal(r.adj)}</Td></tr>)}
                </tbody>
              </Table>
            </Block>
          )}
          <Block sim={a.sim} title="Scale reliability (Cronbach’s α)" text="0.70 is the usual threshold before items are combined into one index.">
            <ul className="flex flex-col gap-1.5 text-sm"><li>Form B pedestrian risk scale (Q14, Q15, Q16, Q18): <b className="font-semibold">{alphaText(a.alphaB)}</b></li><li>Form A perceived obstruction scale (Q6, Q17, Q18): <b className="font-semibold">{alphaText(a.alphaA)}</b></li></ul>
          </Block>
        </div>
      )}
    </>
  );
}
export function ChecksPage() {
  const { analysis: a } = useApp(), c = recordChecks(a), moe = (n: number) => (n ? `±${num(98 / Math.sqrt(n), 1)} pts` : '–');
  const rows: [string, string | number, string | number][] = [
    ['Responses received', a.raw.A.length, a.raw.B.length], ['Consent declined (left out)', a.declinedA, a.declinedB], ['Analysed', a.m.nA, a.m.nB], ['Margin of error for a 50% share, 95% confidence', moe(a.m.nA), moe(a.m.nB)],
    ['Routing answer differs from Q1 (Q1 is used)', '–', c.routing], ['Not an IPT user but answered Q6–Q11', '–', c.notIptAnswered], ['Only one cause ticked in Q20 (form asks for two)', '–', c.oneCause], ['Never stops near the junction (Q6) but reports a queue (Q18)', c.neverButQueue, '–'], ['No U1 or U2 site code', c.noSiteA, c.noSiteB],
  ];
  return (
    <>
      <PageHeader route="checks" />
      {!a.m.nA && !a.m.nB ? <NoData /> : (
        <div className="flex flex-col gap-4">
          <Block sim={a.sim} title="Sample and record checks">
            <Table><thead><tr><Th>Check</Th><Th className="text-right">Form A</Th><Th className="text-right">Form B</Th></tr></thead><tbody>{rows.map((r) => <tr key={r[0]}><Td>{r[0]}</Td><Td className={R}>{r[1]}</Td><Td className={R}>{r[2]}</Td></tr>)}</tbody></Table>
          </Block>
          <div className="grid gap-4 xl:grid-cols-2">
            {(['A', 'B'] as const).map((f) => (
              <Block key={f} sim={a.sim} title={`Form ${f} items`} text="Flagged when more than 10% is missing, more than 20% is “not sure / other / depends”, or one answer takes more than 80%.">
                <Table><thead><tr><Th>Question</Th><Th className="text-right">n</Th><Th className="text-right">Missing</Th><Th>Check</Th></tr></thead>
                  <tbody>{itemChecks(f === 'A' ? a.A : a.B, f).map((x) => <tr key={x.q.id}><Td>Q{x.q.n} {x.q.s}</Td><Td className={R}>{x.n}</Td><Td className={R}>{pct(x.missing, 1)}</Td><Td>{x.flags.length ? <Badge variant="warning">{x.flags.join(', ')}</Badge> : <Badge variant="success">OK</Badge>}</Td></tr>)}</tbody></Table>
              </Block>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

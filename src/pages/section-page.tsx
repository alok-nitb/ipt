import { ArrowLeftRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { JunctionIcon } from '@/components/charts/junction-icon';
import { HBars } from '@/components/charts/bars';
import { ChartCard } from '@/components/panels/parts';
import { barTable, buildSections, ConclusionList, questionBars, SampleCard, type Section } from '@/components/panels/sections';
import { SOURCES, useLoadSource } from '@/components/layout/shell';
import { NAV_ITEMS } from '@/components/layout/nav';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/controls';
import { useApp } from '@/state/app-state';
import { go, type Route } from '@/state/use-route';
import { QSA, QSB } from '@/lib/questions';
import { DATASETS } from '@/lib/datasets';
import type { Site } from '@/lib/survey';
import { cn } from '@/lib/utils';

export function PageHeader({ route, actions }: { route: Route; actions?: ReactNode }) {
  const it = NAV_ITEMS.find((x) => x.route === route)!;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        {it.num && <p className="text-sm font-medium text-primary">Objective {it.num}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{it.heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{it.intro}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2"><SiteFilter />{actions}</div>
    </div>
  );
}
function SiteFilter() {
  const { source, mine, site, setSite } = useApp();
  const both = (['U1', 'U2'] as Site[]).every((s) => [...mine.A, ...mine.B].some((r) => r.site === s));
  if (source !== 'mine' || !both) return null;
  return (
    <ToggleGroup type="single" value={site} onValueChange={(v) => v && setSite(v as Site | 'all')} aria-label="Site">
      <ToggleGroupItem value="all" className="px-3">All sites</ToggleGroupItem><ToggleGroupItem value="U1" className="px-3">U1</ToggleGroupItem><ToggleGroupItem value="U2" className="px-3">U2</ToggleGroupItem>
    </ToggleGroup>
  );
}
export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <JunctionIcon source="mine" className="size-14" /><h2 className="text-lg font-semibold">{title}</h2><p className="max-w-md text-sm text-muted-foreground">{text}</p>{action}
    </Card>
  );
}
export const NoData = () => <Empty title="No responses to analyse yet" text="Load Set 1 or Set 2 from the bar above, or import your Google Forms export." action={<Button onClick={() => go('responses')}>Import responses</Button>} />;

function SectionBlock({ s, first, alone }: { s: Section; first: boolean; alone: boolean }) {
  const part = s.eyebrow.split(' · ').slice(1).join(' · '); // the page header already names the objective
  return (
    <section className={cn(!first && 'mt-10')} aria-labelledby={`h-${s.id}`}>
      <div className="mb-4">
        {part && !alone && <p className="text-[13px] font-medium text-primary">{part}</p>}
        <h2 id={`h-${s.id}`} className="mt-0.5 text-xl leading-snug font-semibold">{s.title}</h2>
        {s.sub && <p className="mt-1 text-[13px] text-muted-foreground">{s.sub}</p>}
      </div>
      {s.body}
    </section>
  );
}
export function SectionPage({ route }: { route: Route }) {
  const { analysis: a } = useApp(), load = useLoadSource(), list = buildSections(a).filter((s) => s.page === route);
  return (
    <>
      <PageHeader route={route} />
      {!a.m.nA && !a.m.nB ? <NoData /> : list.length ? list.map((s, i) => <SectionBlock key={s.id} s={s} first={i === 0} alone={list.length === 1} />)
        : route === 'compare' ? <Empty title="One site is loaded" text="The comparison needs responses from both U1 and U2." action={<Button onClick={() => load('both')}><ArrowLeftRight />Load both sets</Button>} />
          : <Empty title="Not enough responses" text="This page needs more answers than the loaded set has." />}
    </>
  );
}
function SetCards() {
  const { source, mine } = useApp(), load = useLoadSource();
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="group" aria-label="Data set">
      {SOURCES.map((s) => {
        const r = s.id === 'mine' ? mine : DATASETS[s.id], on = source === s.id;
        return (
          <button key={s.id} type="button" aria-pressed={on} onClick={() => load(s.id)} className={cn('group flex items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-card transition-colors hover:border-ring', on && 'border-ring ring-1 ring-ring')}>
            <JunctionIcon source={s.id} className="size-14 shrink-0" />
            <span className="min-w-0">
              <span className="block font-semibold">{s.name}</span><span className="block text-[13px] text-muted-foreground">{s.desc}</span>
              <span className={cn('mt-1 block text-[13px] font-medium', on ? 'text-foreground' : 'text-primary group-hover:underline')}>{on ? (r.A.length + r.B.length ? `Loaded: ${r.A.length} + ${r.B.length} responses` : 'None imported yet') : s.id === 'mine' ? (r.A.length + r.B.length ? `Open ${r.A.length} + ${r.B.length} responses` : 'Import responses') : s.id === 'both' ? 'Load and compare' : 'Load and analyse'}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
export function OverviewPage() {
  const { analysis: a } = useApp(), key = buildSections(a).find((s) => s.id === 'key');
  if (!key) return <><PageHeader route="overview" /><SetCards /><NoData /></>;
  const v = a.m.nA ? questionBars(QSA.A1, a.A, { rank: true, plain: true }) : [], w = a.m.nB ? questionBars(QSB.B1, a.B, { rank: true, plain: true, tone: 'user' }).map((b) => ({ ...b, label: b.label.replace(' (driver / rider)', '') })) : [];
  return (
    <>
      <PageHeader route="overview" />
      <SetCards />
      <div className="flex flex-col gap-4">
        {key.body}
        <div className="grid gap-4 lg:grid-cols-3">
          <SampleCard a={a} />
          <ChartCard badge="footer" title="Operators by vehicle" note="Form A Q1" sim={a.sim} table={barTable(v, 'Vehicle')}><HBars data={v} compact /></ChartCard>
          <ChartCard badge="footer" title="Road users by how they use the junction" note="Form B Q1" sim={a.sim} table={barTable(w, 'Road user')}><HBars data={w} compact /></ChartCard>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4"><h2 className="text-xl font-semibold">What the responses say</h2><Button variant="outline" size="sm" onClick={() => go('conclusions')}>Open conclusions</Button></div>
        <ConclusionList a={{ ...a, conclusions: a.conclusions.slice(0, 4) }} />
      </div>
    </>
  );
}

import { max as d3max, scaleLinear } from 'd3';
import { pct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Legend, tipProps, useEntered } from './base';

export interface Bar { label: string; value: number; display?: string; k?: number; n?: number; lo?: number | null; hi?: number | null; tone?: 'data' | 'adverse' | 'user' }
const TONE = { data: 'bg-data', adverse: 'bg-adverse', user: 'bg-user' };

export function HBars({ data, domainMax, showN, compact }: { data: Bar[]; domainMax?: number; showN?: boolean; compact?: boolean }) {
  const on = useEntered();
  const x = scaleLinear([0, domainMax ?? Math.max(0.01, (d3max(data, (d) => d.value) ?? 1) * 1.04)], [0, 100]).clamp(true);
  return (
    <div className="flex flex-col gap-1.5">
      {data.map((d) => (
        <div
          key={d.label}
          className={cn('group grid items-center gap-x-3 text-[13px] leading-tight', compact ? 'grid-cols-[minmax(0,8.6rem)_minmax(0,1fr)_2.6rem]' : showN ? 'grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)_5.2rem] max-sm:grid-cols-[minmax(0,7.6rem)_minmax(0,1fr)_4.8rem]' : 'grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)_2.8rem] max-sm:grid-cols-[minmax(0,7.6rem)_minmax(0,1fr)_2.8rem]')}
          {...tipProps({ title: d.display ?? pct(d.value, 1), rows: [{ label: d.label, value: d.k != null ? `${d.k} of ${d.n}` : d.n != null ? `n ${d.n}` : undefined }, ...(d.lo != null && d.hi != null ? [{ label: '95% CI', value: `${pct(d.lo)} to ${pct(d.hi)}` }] : [])] })}
        >
          <span className="py-0.5">{d.label}</span>
          <span className="relative h-4 border-l border-[var(--c-axis)]">
            <span className={cn('absolute inset-y-0 left-0 rounded-r transition-[width,filter] duration-500 group-hover:brightness-110', TONE[d.tone ?? 'data'])} style={{ width: on ? `${x(d.value)}%` : 0 }} />
            {d.lo != null && d.hi != null && <span className="absolute top-1/2 -mt-px h-0.5 bg-foreground/55" style={{ left: `${x(d.lo)}%`, width: `${x(d.hi) - x(d.lo)}%` }} />}
          </span>
          <span className="tnum whitespace-nowrap">{d.display ?? pct(d.value)}{showN && <span className="text-[11px] text-muted-foreground"> n {d.n}</span>}</span>
        </div>
      ))}
    </div>
  );
}

export interface DivRow { label: string; n: number; parts: { label: string; p: number; c: 'a2' | 'a1' | 'm' | 'f1' | 'f2' }[] }
const FILL = { a2: 'var(--c-adverse)', a1: 'var(--c-adverse-2)', m: 'var(--c-mid)', f1: 'var(--c-data-2)', f2: 'var(--c-data)' };
/** diverging stacked bars, adverse to the left and favourable to the right of a shared centre */
export function Diverging({ rows, names, ends }: { rows: DivRow[]; names: { c: DivRow['parts'][number]['c']; label: string }[]; ends: [string, string] }) {
  const R = rows.filter((r) => r.n), left = (r: DivRow) => r.parts.reduce((s, x) => s + (x.c[0] === 'a' ? x.p : x.c === 'm' ? x.p / 2 : 0), 0);
  const span = Math.max(0.01, ...R.map((r) => Math.max(left(r), 1 - left(r)))), x = scaleLinear([-span, span], [0, 100]);
  const grid = 'grid grid-cols-[minmax(0,9rem)_3rem_minmax(0,1fr)_3rem] items-center gap-x-2 text-[13px] leading-tight max-sm:grid-cols-[2.8rem_minmax(0,1fr)_2.8rem]';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className={cn(grid, 'text-xs text-muted-foreground')}><span className="max-sm:hidden" /><span className="text-right">{ends[0]}</span><span /><span>{ends[1]}</span></div>
        {R.map((r) => {
          let at = -left(r);
          const side = (k: string) => r.parts.filter((p) => p.c[0] === k).reduce((s, p) => s + p.p, 0);
          return (
            <div key={r.label} className={grid}>
              <span className="max-sm:col-span-3">{r.label} <span className="text-[11px] whitespace-nowrap text-muted-foreground">n {r.n}</span></span>
              <span className="tnum text-right">{pct(side('a'))}</span>
              <span className="relative h-5">
                {r.parts.filter((p) => p.p > 0).map((p) => {
                  const from = x(at), w = x(at + p.p) - from;
                  at += p.p;
                  return <span key={p.label} className="absolute inset-y-0 rounded-[2px] transition-[left,width] duration-500 hover:brightness-110" style={{ left: `${from}%`, width: `calc(${w}% - 2px)`, background: FILL[p.c] }} {...tipProps({ title: pct(p.p, 1), rows: [{ label: `${r.label}: ${p.label}` }] })} />;
                })}
                <span className="pointer-events-none absolute -inset-y-1 left-1/2 w-px bg-[var(--c-axis)]" />
              </span>
              <span className="tnum">{pct(side('f'))}</span>
            </div>
          );
        })}
      </div>
      <Legend items={names.map((n) => ({ color: FILL[n.c], label: n.label }))} />
    </div>
  );
}

/** confidence-interval strip for a KPI */
export function CiStrip({ p, lo, hi }: { p: number; lo: number; hi: number }) {
  return (
    <span className="relative mt-2 block h-1.5 w-full rounded-full bg-muted" role="img" aria-label={`95% confidence interval ${pct(lo)} to ${pct(hi)}`}>
      <span className="absolute inset-y-0 rounded-full bg-data/45" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
      <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-data" style={{ left: `${p * 100}%` }} />
    </span>
  );
}

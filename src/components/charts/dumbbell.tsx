import { scaleLinear } from 'd3';
import type { CompareRow } from '@/lib/survey';
import { pct, pVal } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Legend, tipProps } from './base';

export function Dumbbell({ rows }: { rows: CompareRow[] }) {
  const x = scaleLinear([0, 1], [0, 100]), grid = 'grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)_3rem_3rem_6.5rem] items-center gap-x-3 max-md:grid-cols-[minmax(0,1fr)_2.6rem_2.6rem_5.4rem]';
  return (
    <div className="flex flex-col gap-3">
      <Legend items={[{ color: 'var(--c-data)', shape: 'dot', label: 'U1, four-arm, moderate flow' }, { color: 'var(--c-user)', shape: 'dot', label: 'U2, T-junction, higher flow' }]} />
      <div className="flex flex-col text-[13px] leading-tight">
        <div className={cn(grid, 'pb-1 text-xs text-muted-foreground')}>
          <span className="max-md:hidden">Indicator</span><span className="flex justify-between"><span>0%</span><span>50%</span><span>100%</span></span><span className="text-right">U1</span><span className="text-right">U2</span><span className="text-right">Adjusted p</span>
        </div>
        {rows.map((r) => {
          const p = r.a.p ?? 0, q = r.b.p ?? 0, sig = r.adj != null && r.adj < 0.05;
          return (
            <div key={r.key} className={cn(grid, 'border-t py-1')} {...tipProps({ title: r.t, rows: [{ label: 'U1', value: `${pct(p, 1)} (${r.a.k} of ${r.a.n})`, color: 'var(--c-data)' }, { label: 'U2', value: `${pct(q, 1)} (${r.b.k} of ${r.b.n})`, color: 'var(--c-user)' }] })}>
              <span className="max-md:col-span-4">{r.t}</span>
              <span className="relative h-6">
                <span className="absolute top-1/2 h-px w-full bg-[var(--c-grid)]" />
                <span className="absolute top-1/2 -mt-[1.5px] h-[3px] bg-mid transition-all duration-500" style={{ left: `${x(Math.min(p, q))}%`, width: `${x(Math.abs(p - q))}%` }} />
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-data transition-all duration-500" style={{ left: `${x(p)}%` }} />
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-user transition-all duration-500" style={{ left: `${x(q)}%` }} />
              </span>
              <span className="tnum text-right">{pct(p)}</span><span className="tnum text-right">{pct(q)}</span>
              <span className="tnum flex justify-end">{sig ? <Badge variant="success">{pVal(r.adj)}</Badge> : <span className="text-muted-foreground">{pVal(r.adj)}</span>}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

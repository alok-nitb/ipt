import { scaleLog } from 'd3';
import type { LogitFit } from '@/lib/stats';
import { num, pText } from '@/lib/format';
import { cn } from '@/lib/utils';
import { tipProps } from './base';

export function Forest({ fit }: { fit: LogitFit }) {
  const x = scaleLog([0.08, 12.5], [0, 100]).clamp(true), grid = 'grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_8.4rem] items-center gap-x-3 max-sm:grid-cols-[minmax(0,1fr)_8rem]';
  return (
    <div className="flex flex-col gap-1 text-[13px] leading-tight">
      {fit.rows.map((r) => {
        const sig = r.p < 0.05, c = sig ? 'var(--c-data)' : 'var(--muted-foreground)';
        return (
          <div key={r.t} className={grid} {...tipProps({ title: `Odds ratio ${num(r.or, 2)}`, rows: [{ label: r.t }, { label: '95% CI', value: `${num(r.lo, 2)} to ${num(r.hi, 2)}` }, { label: pText(r.p) }] })}>
            <span className="max-sm:col-span-2">{r.t}</span>
            <span className="relative h-8">
              <span className="absolute inset-y-0 w-px bg-[var(--c-axis)]" style={{ left: `${x(1)}%` }} />
              <span className="absolute top-1/2 -mt-px h-0.5 transition-all duration-500" style={{ left: `${x(r.lo)}%`, width: `${x(r.hi) - x(r.lo)}%`, background: c }} />
              <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card transition-all duration-500" style={{ left: `${x(r.or)}%`, background: c }} />
            </span>
            <span className={cn('tnum', sig && 'font-semibold')}>{num(r.or, 2)} <span className="font-normal text-muted-foreground">({num(r.lo, 2)}–{num(r.hi, 2)})</span>{sig && ' *'}</span>
          </div>
        );
      })}
      <div className={cn(grid, 'text-xs text-muted-foreground')}>
        <span className="max-sm:hidden" />
        <span className="relative h-4">{[0.1, 0.3, 1, 3, 10].map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: `${x(t)}%` }}>{t}</span>)}</span>
        <span>odds ratio (95% CI)</span>
      </div>
    </div>
  );
}

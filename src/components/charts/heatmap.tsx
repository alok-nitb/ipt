import { scaleLinear } from 'd3';
import { QSA } from '@/lib/questions';
import { has, type Row } from '@/lib/survey';
import { pct } from '@/lib/format';
import { Legend, tipProps } from './base';

export function crossTab(rows: Row[]) {
  const R = QSA.A9.o!, C = QSA.A10.o!, M = R.map(() => C.map(() => 0));
  let n = 0;
  rows.forEach((r) => { if (has(r.A9) && has(r.A10)) { M[r.A9][r.A10]++; n++; } });
  return { R, C, M, n };
}
const SHORT = ['Kerb / road edge', 'Partly in lane', 'Fully in lane', 'Depends on space'];
export function Heatmap({ rows }: { rows: Row[] }) {
  const { R, M, n } = crossTab(rows), mx = Math.max(1, ...M.flat()), k = scaleLinear([0, mx], [5, 100]);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative grid grid-cols-[minmax(0,6.6rem)_repeat(4,minmax(0,1fr))] gap-0.5 text-[13px] max-sm:grid-cols-[minmax(0,4.6rem)_repeat(4,minmax(0,1fr))] max-sm:text-xs">
        {SHORT.map((c, j) => <span key={c} className="self-end px-1 pb-1 text-center text-xs leading-tight text-muted-foreground" style={{ gridRow: 1, gridColumn: j + 2 }}>{c}</span>)}
        {R.map((r, i) => [
          <span key={r} className="self-center pr-2 leading-tight" style={{ gridRow: i + 2, gridColumn: 1 }}>{r}</span>,
          ...SHORT.map((c, j) => {
            const v = M[i][j], s = v / mx;
            return (
              <span key={r + c} className="tnum grid min-h-10 place-items-center rounded-sm" style={{ gridRow: i + 2, gridColumn: j + 2, background: `color-mix(in oklab, var(--c-data) ${k(v).toFixed(0)}%, var(--card))`, color: s > 0.86 ? 'var(--c-on-data)' : s > 0.66 ? 'var(--c-heat-mid)' : 'var(--foreground)' }} {...tipProps({ title: pct(v / n, 1), rows: [{ label: `${r}, ${c.toLowerCase()}`, value: `${v} of ${n}` }] })}>{pct(v / n)}</span>
            );
          }),
        ])}
        <span className="pointer-events-none -m-0.5 rounded-md border-2 border-adverse" style={{ gridRow: '2 / 4', gridColumn: '3 / 5' }} />
      </div>
      <Legend items={[{ color: 'var(--c-adverse)', shape: 'ring', label: 'Within 50 m and in the traffic lane' }]} />
    </div>
  );
}

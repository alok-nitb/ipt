import { max, scaleLinear } from 'd3';
import { QSA } from '@/lib/questions';
import { dist, DWELL_EDGE, type Analysis } from '@/lib/survey';
import { num, pct } from '@/lib/format';
import { tipProps, useEntered, useWidth } from './base';

/** stop duration on a true seconds axis: classes differ in width, so area (not height) shows the share */
export function DwellHistogram({ a, height = 250 }: { a: Analysis; height?: number }) {
  const [ref, width] = useWidth(), on = useEntered();
  const m = { t: 46, r: 12, b: 40, l: 12 }, w = Math.max(0, width - m.l - m.r), h = height - m.t - m.b;
  const d = dist(a.A, QSA.A11), bins = d.counts.map((k, i) => ({ k, p: d.n ? k / d.n : 0, x0: DWELL_EDGE[i], x1: DWELL_EDGE[i + 1], label: QSA.A11.o![i], density: (d.n ? k / d.n : 0) / (DWELL_EDGE[i + 1] - DWELL_EDGE[i]) }));
  const x = scaleLinear([0, 90], [0, w]), y = scaleLinear([0, max(bins, (b) => b.density) || 1], [h, 0]);
  const marks = [{ v: a.m.dwell, t: 'mean', row: 0 }, { v: a.m.p85, t: '85th percentile', row: 1 }].filter((z) => z.v != null);
  return (
    <div ref={ref} style={{ height }}>
      {width > 0 && (
        <svg className="chart" width={width} height={height} role="img" aria-label={`Stop duration. Mean ${num(a.m.dwell, 0)} seconds, 85th percentile ${num(a.m.p85, 0)} seconds.`}>
          <g transform={`translate(${m.l},${m.t})`}>
            {bins.map((b, i) => {
              const bx = x(b.x0) + 1, bw = Math.max(0, x(b.x1) - x(b.x0) - 2), bh = h - y(b.density);
              return (
                <g key={b.label} {...tipProps({ title: pct(b.p, 1), rows: [{ label: b.label, value: `${b.k} of ${d.n}` }] })}>
                  <rect x={bx} width={bw} y={0} height={h} fill="transparent" />
                  <rect x={bx} width={bw} y={on ? y(b.density) : h} height={on ? bh : 0} rx={3} fill={i >= 3 ? 'var(--c-adverse)' : 'var(--c-data)'} className="transition-all duration-500 hover:brightness-110" />
                </g>
              );
            })}
            <line x2={w} y1={h} y2={h} stroke="var(--c-axis)" />
            {[0, 10, 20, 30, 60].map((t) => <g key={t} transform={`translate(${x(t)},${h})`}><line y2={5} stroke="var(--c-axis)" /><text y={18} textAnchor={t ? 'middle' : 'start'} className="tnum">{t}{t === 60 ? '+' : ''}</text></g>)}
            <text x={w} y={h + 34} textAnchor="end">Seconds stopped</text>
            {marks.map((z) => (
              <g key={z.t} transform={`translate(${x(z.v!)},0)`}>
                <line y1={-m.t + 16 + z.row * 18} y2={h} stroke="var(--foreground)" strokeWidth={1.25} strokeOpacity={0.75} />
                <text x={6} y={-m.t + 20 + z.row * 18} dy="0.1em"><tspan className="strong">{num(z.v, 0)} s</tspan> {z.t}</text>
              </g>
            ))}
            {bins.map((b) => <text key={b.label} x={(x(b.x0) + x(b.x1)) / 2} y={y(b.density) - 6} textAnchor="middle" className="strong tnum" pointerEvents="none" style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 4, strokeLinejoin: 'round' }}>{pct(b.p)}</text>)}
          </g>
        </svg>
      )}
    </div>
  );
}

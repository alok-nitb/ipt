import { line, range, scaleLinear } from 'd3';
import { useState } from 'react';
import { acceptance, BAY_A, BAY_B, type Analysis } from '@/lib/survey';
import { pct } from '@/lib/format';
import { hideTip, Legend, showTip, useWidth } from './base';

/** share of each group that accepts a bay at a given distance */
export function AcceptanceCurve({ a, height = 300 }: { a: Analysis; height?: number }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const m = { t: 14, r: 14, b: 42, l: 44 }, w = Math.max(0, width - m.l - m.r), h = height - m.t - m.b;
  const x = scaleLinear([0, 150], [0, w]), y = scaleLinear([0, 1], [h, 0]), xs = range(0, 151);
  const sA = xs.map((d) => acceptance(a.A, 'A23', BAY_A, d)), sB = xs.map((d) => acceptance(a.B, 'B23', BAY_B, d));
  const path = line<number | null>().defined((v) => v != null).x((_, i) => x(i)).y((v) => y(v!));
  const lvl = a.level / 100;
  const move = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), d = Math.max(0, Math.min(150, Math.round((150 * (e.clientX - r.left)) / r.width)));
    setHover(d);
    showTip(e, { title: `${d} m from the junction`, rows: [{ label: 'Operators', value: pct(sA[d]), color: 'var(--c-data)' }, { label: 'Road users', value: pct(sB[d]), color: 'var(--c-user)' }] });
  };
  return (
    <div className="flex flex-col gap-2">
      <Legend items={[
        { color: 'var(--c-data)', shape: 'line', label: <>Operators{a.offA != null && <>: up to <b className="font-semibold text-foreground">{a.offA} m</b></>}</> },
        { color: 'var(--c-user)', shape: 'line', label: <>Road users{a.offB != null && <>: up to <b className="font-semibold text-foreground">{a.offB} m</b></>}</> },
      ]} />
      <div ref={ref} style={{ height }}>
        {width > 0 && (
          <svg className="chart" width={width} height={height} role="img" aria-label={`Acceptance of a bay by distance. ${a.level}% of operators accept up to ${a.offA ?? 'unknown'} metres and ${a.level}% of road users up to ${a.offB ?? 'unknown'} metres.`}>
            <g transform={`translate(${m.l},${m.t})`}>
              {y.ticks(5).map((t) => <g key={t} transform={`translate(0,${y(t)})`}><line x2={w} stroke="var(--c-grid)" /><text x={-8} dy="0.32em" textAnchor="end" className="tnum">{pct(t)}</text></g>)}
              {range(0, 151, 25).map((t) => <text key={t} x={x(t)} y={h + 18} textAnchor="middle" className="tnum">{t}</text>)}
              <text x={w / 2} y={h + 36} textAnchor="middle">Distance of the bay from the junction (m)</text>
              <line x2={w} y1={y(lvl)} y2={y(lvl)} stroke="var(--foreground)" strokeWidth={1.25} />
              <text x={w} y={y(lvl) - 6} textAnchor="end" className="ink">acceptable to {a.level}%</text>
              <path d={path(sA) ?? ''} fill="none" stroke="var(--c-data)" strokeWidth={2.25} strokeLinejoin="round" />
              <path d={path(sB) ?? ''} fill="none" stroke="var(--c-user)" strokeWidth={2.25} strokeLinejoin="round" />
              {hover != null && <line x1={x(hover)} x2={x(hover)} y2={h} stroke="var(--foreground)" strokeOpacity={0.45} pointerEvents="none" />}
              {a.offA != null && <circle cx={x(a.offA)} cy={y(lvl)} r={5.5} fill="var(--c-data)" stroke="var(--card)" strokeWidth={2} />}
              {a.offB != null && <circle cx={x(a.offB)} cy={y(lvl)} r={5.5} fill="var(--c-user)" stroke="var(--card)" strokeWidth={2} />}
              <rect width={w} height={h} fill="transparent" onPointerMove={move} onPointerLeave={() => { setHover(null); hideTip(); }} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

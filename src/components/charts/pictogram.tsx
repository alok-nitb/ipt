import { range } from 'd3';
import { pct } from '@/lib/format';
import { Legend, tipProps } from './base';

/** 100 people, coloured by share; shares are rounded so that they add up to 100 */
export function Pictogram({ parts, label }: { parts: { label: string; p: number; color: string }[]; label: string }) {
  const raw = parts.map((x) => x.p * 100), base = raw.map(Math.floor);
  let left = 100 - base.reduce((s, v) => s + v, 0);
  raw.map((v, i) => [v - base[i], i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) base[i]++; });
  const who = base.flatMap((k, i) => range(k).map(() => i));
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox="0 0 400 116" className="w-full" role="img" aria-label={`${label}: ${parts.map((x) => `${pct(x.p)} ${x.label}`).join(', ')}`}>
        {who.map((w, i) => {
          const c = Math.floor(i / 5), r = i % 5, p = parts[w];
          return (
            <g key={i} transform={`translate(${c * 20 + 10},${r * 23 + 11})`} fill={p.color} {...tipProps({ title: pct(p.p, 1), rows: [{ label: p.label }] })}>
              <rect x={-10} y={-11.5} width={20} height={23} fill="transparent" />
              <circle cy={-6} r={3.3} /><path d="M-4.6 8V1.6A4.6 4.6 0 0 1 0-2a4.6 4.6 0 0 1 4.6 3.6V8a1 1 0 0 1-1 1h-7.2a1 1 0 0 1-1-1Z" />
            </g>
          );
        })}
      </svg>
      <Legend items={parts.map((x) => ({ color: x.color, shape: 'dot' as const, label: <><b className="tnum font-semibold text-foreground">{pct(x.p)}</b> {x.label}</> }))} />
    </div>
  );
}

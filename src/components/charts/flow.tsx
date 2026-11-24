import { sankey, sankeyLinkHorizontal, type SankeyGraph } from 'd3-sankey';
import { QSA } from '@/lib/questions';
import { has, type Row } from '@/lib/survey';
import { pct } from '@/lib/format';
import { Legend, tipProps, useWidth } from './base';

interface N { id: string; label: string; col: number; hot?: boolean }
interface L { source: string; target: string; value: number; queue: boolean }
const POS = ['At the kerb', 'Partly in lane', 'Fully in lane', 'Depends on space'];
const BEHIND = ['No effect', 'Slow down', 'Change lane', 'Short queue', 'Queue to junction'];

export function flowData(rows: Row[]) {
  const use = rows.filter((r) => has(r.A9) && has(r.A10) && has(r.A18)), links = new Map<string, L>();
  const add = (s: string, t: string, queue: boolean) => { const k = `${s}|${t}|${queue}`, l = links.get(k); if (l) l.value++; else links.set(k, { source: s, target: t, value: 1, queue }); };
  use.forEach((r) => { const q = r.A18 >= 3; add(`d${r.A9}`, `p${r.A10}`, q); add(`p${r.A10}`, `b${r.A18}`, q); });
  const nodes: N[] = [...QSA.A9.o!.map((label, i) => ({ id: `d${i}`, label, col: 0 })), ...POS.map((label, i) => ({ id: `p${i}`, label, col: 1 })), ...BEHIND.map((label, i) => ({ id: `b${i}`, label, col: 2, hot: i >= 3 }))];
  const L = [...links.values()], on = new Set(L.flatMap((l) => [l.source, l.target]));
  return { nodes: nodes.filter((x) => on.has(x.id)), links: L, n: use.length };
}
/** distance -> position -> what happens behind; red flows end in a queue */
export function OutcomeFlow({ rows, height = 330 }: { rows: Row[]; height?: number }) {
  const [ref, width] = useWidth(), { nodes, links, n } = flowData(rows);
  const W = Math.max(660, width), m = { t: 28, r: 152, b: 8, l: 138 };
  if (!n) return <p className="text-sm text-muted-foreground">No responses.</p>;
  const order = new Map(nodes.map((x, i) => [x.id, i]));
  const g: SankeyGraph<N, L> = sankey<N, L>()
    .nodeId((d) => d.id).nodeWidth(12).nodePadding(12).nodeAlign((d) => d.col)
    .nodeSort((p, q) => order.get(p.id)! - order.get(q.id)!).linkSort((p, q) => Number(q.queue) - Number(p.queue))
    .extent([[m.l, m.t], [W - m.r, height - m.b]])({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
  const path = sankeyLinkHorizontal<N, L>(), share = (v?: number) => pct((v ?? 0) / n), name = (x: unknown) => (x as N).label;
  return (
    <div className="flex flex-col gap-3">
      <div ref={ref} className="overflow-x-auto">
        {width > 0 && (
          <svg className="chart block" width={W} height={height} role="img" aria-label="Flow from stop distance to position to what happens behind">
            {['Stop distance', 'Position', 'What happens behind'].map((t, i) => <text key={t} x={i === 0 ? m.l + 12 : i === 1 ? (m.l + W - m.r) / 2 : W - m.r} y={14} textAnchor={i === 0 ? 'end' : i === 1 ? 'middle' : 'start'} className="strong">{t}</text>)}
            <g fill="none">
              {g.links.map((l, i) => <path key={i} d={path(l) ?? ''} stroke={l.queue ? 'var(--c-adverse)' : 'var(--c-data)'} strokeOpacity={l.queue ? 0.5 : 0.2} strokeWidth={Math.max(1, l.width ?? 1)} className="transition-[stroke-opacity] hover:[stroke-opacity:0.8]" {...tipProps({ title: share(l.value), rows: [{ label: `${name(l.source)} → ${name(l.target)}`, value: `${l.value} of ${n}` }, { label: l.queue ? 'Queue behind' : 'No queue behind' }] })} />)}
            </g>
            {g.nodes.map((d) => {
              const h = (d.y1 ?? 0) - (d.y0 ?? 0), left = d.col === 0;
              return (
                <g key={d.id} {...tipProps({ title: share(d.value), rows: [{ label: d.label, value: `${d.value} of ${n}` }] })}>
                  <rect x={d.x0} y={d.y0} width={12} height={Math.max(2, h)} rx={2} fill={d.hot ? 'var(--c-adverse)' : 'var(--c-axis)'} />
                  <text x={left ? d.x0! - 7 : d.x1! + 7} y={(d.y0! + d.y1!) / 2} dy="0.35em" textAnchor={left ? 'end' : 'start'} style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: d.col === 1 ? 3 : 0 }} className="ink">{d.label} <tspan className="strong tnum">{share(d.value)}</tspan></text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <Legend items={[{ color: 'var(--c-adverse)', label: 'Operators who report a queue behind' }, { color: 'var(--c-data-2)', label: 'Operators who do not' }]} />
    </div>
  );
}

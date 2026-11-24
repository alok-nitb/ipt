import { easeCubicOut, range, scaleLinear, select } from 'd3';
import 'd3-transition'; // adds selection.transition(); without this the production build drops it
import { useEffect, useId, useRef } from 'react';
import type { Row, Site } from '@/lib/survey';
import { pct } from '@/lib/format';
import { reducedMotion } from '@/lib/utils';
import { crossTab } from './heatmap';
import { hideTip, Legend, showTip, useWidth } from './base';

interface Glyph { id: string; x: number; y: number; hot: boolean; cell: string; share: number }
const BANDS = [{ a: 0, b: 25, t: 'Less than 25 m' }, { a: 25, b: 50, t: '25–50 m' }, { a: 50, b: 100, t: '50–100 m' }, { a: 100, b: 130, t: 'More than 100 m' }];
const LANES = [{ pos: 2, t: 'Fully in lane', h: 44 }, { pos: 1, t: 'Partly in lane', h: 64 }, { pos: 0, t: 'Kerb / road edge', h: 64 }];

/**
 * One approach to the junction, drawn to scale along the road. Each vehicle is 1% of operators, placed by
 * stated stop distance (Form A Q9) and position (Q10). "Not sure" and "depends on space" cannot be placed.
 */
export function RoadStrip({ rows, site, offset, showLegend = true }: { rows: Row[]; site?: Site; offset?: number | null; showLegend?: boolean }) {
  const [ref, width] = useWidth(), layer = useRef<SVGGElement>(null), uid = useId().replace(/[:«»]/g, '');
  const { M, n } = crossTab(rows);
  const W = Math.max(860, width), J = 104, opp = 34, foot = 24, top = 30, laneTop = top + opp + 4;
  const laneY = LANES.map((_, i) => laneTop + LANES.slice(0, i).reduce((s, l) => s + l.h, 0)), kerbY = laneTop + LANES.reduce((s, l) => s + l.h, 0), H = kerbY + foot + 34;
  const x = scaleLinear([0, 130], [J, W - 112]), zoneShare = n ? (M[0][1] + M[0][2] + M[1][1] + M[1][2]) / n : 0;
  const unplaced = n ? 1 - BANDS.reduce((s, _, i) => s + M[i][0] + M[i][1] + M[i][2], 0) / n : 0;
  const key = JSON.stringify(M) + W;

  useEffect(() => {
    if (!layer.current) return;
    const glyphs: Glyph[] = [];
    BANDS.forEach((b, i) => LANES.forEach((l, li) => {
      const share = n ? M[i][l.pos] / n : 0, k = Math.round(share * 100);
      if (!k) return;
      const x0 = x(b.a) + (i ? 15 : 26), x1 = x(b.b) - 15, per = Math.max(1, Math.floor((x1 - x0) / 23) + 1), maxRows = Math.max(1, Math.floor((l.h - 6) / 14)), rowsN = Math.min(maxRows, Math.max(1, Math.ceil(k / per))), cols = Math.ceil(k / rowsN);
      range(k).forEach((j) => {
        const c = Math.floor(j / rowsN), r = j % rowsN, step = cols > 1 ? Math.min(30, (x1 - x0) / (cols - 1)) : 0;
        glyphs.push({ id: `${i}-${l.pos}-${j}`, x: x0 + c * step, y: laneY[li] + l.h / 2 + (r - (rowsN - 1) / 2) * 14, hot: i <= 1 && l.pos >= 1, cell: `${b.t}, ${l.t.toLowerCase()}`, share });
      });
    }));
    const t = reducedMotion() ? 0 : 700;
    select(layer.current)
      .selectAll<SVGUseElement, Glyph>('use')
      .data(glyphs, (d) => d.id)
      .join(
        (enter) => enter.append('use').attr('href', `#auto-${uid}`).attr('transform', (d) => `translate(${d.x + 60},${d.y})`).style('opacity', 0),
        (update) => update,
        (exit) => exit.call((s) => s.transition().duration(t / 2).style('opacity', 0).remove()),
      )
      .on('pointermove', (e: PointerEvent, d) => showTip(e, { title: pct(d.share, 1), rows: [{ label: d.cell }] }))
      .on('pointerleave', hideTip)
      .attr('color', (d) => (d.hot ? 'var(--c-adverse)' : 'var(--c-data)'))
      .transition().duration(t).ease(easeCubicOut)
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('opacity', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, uid, width]);

  const tee = site === 'U2';
  return (
    <div className="flex flex-col gap-3">
      <div ref={ref} className="overflow-x-auto">
        {width > 0 && (
          <svg className="chart block" width={W} height={H} role="img" aria-label={`Stated stopping places on one approach. ${pct(zoneShare)} of operators stop within 50 metres and in the traffic lane.`}>
            <defs>
              {/* auto-rickshaw seen from above, travelling left */}
              <symbol id={`auto-${uid}`} overflow="visible">
                <g transform="scale(0.84)">
                <path d="M-11 0C-11-3-8-5.5-4-6H8.5A2.5 2.5 0 0 1 11-3.5v7A2.5 2.5 0 0 1 8.5 6H-4C-8 5.5-11 3-11 0Z" fill="currentColor" stroke="var(--card)" strokeWidth={1} />
                <path d="M-5.5-3.6v7.2" stroke="var(--card)" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
                <rect x={-1.5} y={-3.4} width={9.5} height={6.8} rx={1.4} fill="var(--card)" opacity={0.28} />
                </g>
              </symbol>
            </defs>
            {/* land, footpath and carriageway */}
            <rect width={W} height={H - 34} fill="var(--plot)" rx={8} />
            <rect x={tee ? 22 : 0} y={top - 10} width={W - (tee ? 22 : 0)} height={kerbY - top + 10 + foot} fill="var(--footpath)" />
            <rect x={22} width={J - 34} y={0} height={H - 34} fill="var(--road)" />
            <rect x={tee ? 22 : 0} y={top} width={W - (tee ? 22 : 0)} height={kerbY - top} fill="var(--road)" />
            <rect x={J} y={laneY[2]} width={W - J} height={LANES[2].h} fill="var(--road-2)" />
            {/* centre lines, stop line and crossing */}
            <line x1={J + 6} x2={W} y1={laneTop - 2} y2={laneTop - 2} stroke="var(--road-line)" strokeWidth={2} strokeDasharray="14 10" />
            <line x1={22 + (J - 34) / 2} x2={22 + (J - 34) / 2} y1={0} y2={top - 14} stroke="var(--road-line)" strokeWidth={2} strokeDasharray="8 6" />
            {range(6).map((i) => <rect key={i} x={J - 10} width={14} y={top + 8 + (i * (kerbY - top - 12)) / 6} height={9} fill="var(--road-line)" opacity={0.9} />)}
            <line x1={J + 10} x2={W} y1={laneY[2]} y2={laneY[2]} stroke="var(--road-line)" strokeWidth={1} opacity={0.55} />
            <line x1={J} x2={W} y1={kerbY} y2={kerbY} stroke="var(--c-axis)" strokeWidth={2.5} />
            {/* distance bands */}
            {[25, 50, 100].map((d) => <line key={d} x1={x(d)} x2={x(d)} y1={laneTop} y2={kerbY} stroke="var(--road-line)" strokeWidth={1} strokeDasharray="3 4" />)}
            <rect x={x(0) + 4} y={laneTop + 1} width={x(50) - x(0) - 4} height={laneY[2] - laneTop - 2} rx={6} fill="var(--c-adverse)" fillOpacity={0.12} stroke="var(--c-adverse)" strokeWidth={1.5} />
            <text x={x(0) + 8} y={top + 21} style={{ fill: 'var(--foreground)' }}><tspan className="strong">{pct(zoneShare)}</tspan> within 50 m and in the lane</text>
            {LANES.map((l, i) => <text key={l.t} x={W - 14} y={laneY[i] + l.h / 2} dy="0.35em" textAnchor="end" style={{ fill: 'var(--foreground)', opacity: 0.75 }}>{l.t}</text>)}
            <text x={W - 14} y={kerbY + foot / 2} dy="0.35em" textAnchor="end">Footpath</text>
            <text x={22 + (J - 34) / 2} y={(top + kerbY) / 2} dy="0.35em" textAnchor="middle" className="strong">{site ?? 'Junction'}</text>
            <g ref={layer} />
            {offset != null && (
              <g transform={`translate(${x(offset)},0)`}>
                <line y1={top - 8} y2={kerbY + foot - 2} stroke="var(--foreground)" strokeWidth={2} />
                <g transform={`translate(0,${top - 8})`}><rect x={0} y={-21} width={142} height={21} rx={4} fill="var(--foreground)" /><text x={9} y={-6} style={{ fill: 'var(--background)', fontWeight: 600 }}>Acceptable bay: {offset} m</text></g>
              </g>
            )}
            {/* distance axis */}
            <g transform={`translate(0,${H - 34})`}>
              {[0, 25, 50, 100].map((d) => <g key={d} transform={`translate(${x(d)},0)`}><line y2={6} stroke="var(--c-axis)" /><text y={20} textAnchor={d ? 'middle' : 'start'} className="tnum">{d} m</text></g>)}
              <text x={W - 14} y={20} textAnchor="end">from the junction</text>
            </g>
          </svg>
        )}
      </div>
      {showLegend && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <Legend items={[{ color: 'var(--c-adverse)', label: 'In the lane within 50 m' }, { color: 'var(--c-data)', label: 'Other stops' }]} />
          <p className="text-[13px] text-muted-foreground">Each vehicle is 1% of operators (n {n}). {pct(unplaced)} answered “not sure” or “depends on space” and are not drawn.</p>
        </div>
      )}
    </div>
  );
}

import { createContext, useContext, useState, type ReactNode } from 'react';
import { BarChart3, FlaskConical, Table2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Td, Th, ToggleGroup, ToggleGroupItem } from '@/components/ui/controls';
import type { SurveyTest } from '@/lib/survey';
import { pText } from '@/lib/format';
import { cn } from '@/lib/utils';

/** true inside present mode, where editing and view toggles are hidden */
export const PresentContext = createContext(false);
export const usePresenting = () => useContext(PresentContext);

/** left out of slides, where space is tight */
export const PageOnly = ({ children }: { children: ReactNode }) => (usePresenting() ? null : children);

export const SimBadge = () => <Badge variant="warning"><FlaskConical />Simulated</Badge>;

export interface TableData { head: string[]; rows: (string | number)[][] }
export function DataTable({ head, rows }: TableData) {
  return (
    <Table>
      <thead><tr>{head.map((h, i) => <Th key={i} className={i ? 'text-right' : ''}>{h}</Th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <Td key={j} className={j ? 'tnum text-right whitespace-nowrap' : ''}>{c}</Td>)}</tr>)}</tbody>
    </Table>
  );
}
export function ChartCard({ title, note, sim, badge = 'header', table, className, children }: { title: ReactNode; note?: ReactNode; sim: boolean; badge?: 'header' | 'footer'; table?: TableData; className?: string; children: ReactNode }) {
  const [view, setView] = useState('chart'), presenting = usePresenting();
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div className="min-w-0"><CardTitle>{title}</CardTitle>{note && <CardDescription className="mt-0.5">{note}</CardDescription>}</div>
        {!presenting && (
          <div className="flex shrink-0 items-center gap-2">
            {sim && badge === 'header' && <SimBadge />}
            {table && (
              <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)} aria-label="View">
                <ToggleGroupItem value="chart" aria-label="Chart"><BarChart3 /></ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table"><Table2 /></ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1">{view === 'table' && table && !presenting ? <DataTable {...table} /> : children}</CardContent>
      {sim && badge === 'footer' && !presenting && <div className="-mt-2 flex justify-end px-5 pb-4"><SimBadge /></div>}
    </Card>
  );
}

export interface Reading { text: ReactNode; test?: SurveyTest; extra?: string }
export function Readings({ items }: { items: (Reading | null | undefined | false)[] }) {
  const list = items.filter((x): x is Reading => Boolean(x));
  if (!list.length) return null;
  return (
    <ul className="flex flex-col divide-y rounded-xl border bg-card shadow-card">
      {list.map((r, i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
          {r.test && <Badge variant={r.test.sig ? 'success' : 'neutral'} className="self-center">{r.test.sig ? 'Significant' : 'Not significant'}</Badge>}
          <span className="min-w-0 flex-1 basis-80">{r.text}</span>
          {r.test && <span className="font-mono text-xs text-muted-foreground">{r.test.stat}, n {r.test.n}, adjusted {pText(r.test.adj)}{r.extra ? `, ${r.extra}` : ''}</span>}
        </li>
      ))}
    </ul>
  );
}
export const Grid = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('grid gap-4 lg:grid-cols-2', className)}>{children}</div>;
export const DCrit = () => <>D<sub>crit</sub></>;
/** renders D_crit with a subscript inside plain text */
export const RichText = ({ text }: { text: string }) => <>{text.split('D_crit').map((t, i) => <span key={i}>{i > 0 && <DCrit />}{t}</span>)}</>;

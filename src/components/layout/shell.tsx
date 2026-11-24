import { useState, type ReactNode } from 'react';
import { ClipboardCopy, Download, FileSpreadsheet, Menu, Monitor, Moon, Play, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, SheetContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup as Toggle } from 'radix-ui';
import { Tooltip } from '@/components/ui/controls';
import { JunctionIcon } from '@/components/charts/junction-icon';
import { SimBadge } from '@/components/panels/parts';
import { useApp } from '@/state/app-state';
import { useTheme, type Theme } from '@/state/use-theme';
import { go, type Route } from '@/state/use-route';
import { conclusionsText, SOURCE_NAME, usable, type Form, type Source } from '@/lib/survey';
import { DATASETS } from '@/lib/datasets';
import { downloadText, exportCSV } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { NAV } from './nav';

export const SOURCES: { id: Source; short: string; name: string; desc: string }[] = [
  { id: 'U1', short: 'Set 1', name: 'Set 1 · Site U1', desc: 'Four-arm junction, moderate flow' },
  { id: 'U2', short: 'Set 2', name: 'Set 2 · Site U2', desc: 'T-junction, higher flow' },
  { id: 'both', short: 'Both', name: 'Sets 1 + 2', desc: 'Compare U1 with U2' },
  { id: 'mine', short: 'Mine', name: 'My responses', desc: 'Google Forms CSV or typed entries' },
];
export function useLoadSource() {
  const { setSource, mine } = useApp();
  return (s: Source) => {
    if (s === 'mine' && !mine.A.length && !mine.B.length) { setSource('mine'); go('responses'); return; }
    setSource(s);
    const r = s === 'mine' ? mine : DATASETS[s];
    toast.success(`${SOURCE_NAME[s]} loaded and analysed`, { description: `${usable(r.A).length} operators, ${usable(r.B).length} road users` });
  };
}

function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden><rect width="32" height="32" rx="8" fill="var(--c-data)" /><path d="M16 3v26M3 16h26" stroke="#fff" strokeWidth="7" opacity=".95" /><path d="M16 4v7M16 21v7M4 16h7M21 16h7" stroke="var(--c-data)" strokeWidth="1.4" strokeDasharray="2 1.6" /></svg>
      <div className="leading-tight"><div className="text-[15px] font-semibold tracking-tight">IPT Survey Analyser</div><div className="text-xs text-muted-foreground">Unsignalised intersections</div></div>
    </div>
  );
}
function NavList({ route, onNavigate }: { route: Route; onNavigate?: () => void }) {
  const { analysis: a } = useApp();
  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">{g.group}</div>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const active = it.route === route, Icon = it.icon;
              return (
                <li key={it.route}>
                  <a href={`#/${it.route}`} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', active ? 'bg-primary-soft font-medium text-primary' : 'text-foreground/85 hover:bg-muted', it.route === 'compare' && !a.compare && 'opacity-55')}>
                    <Icon className="size-4 shrink-0" /><span className="flex-1">{it.label}</span>
                    {it.num && <span className={cn('tnum text-xs', active ? 'text-primary' : 'text-muted-foreground')}>{it.num}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Theme"><Sun className="dark:hidden" /><Moon className="hidden dark:block" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem value="light"><Sun />Light</DropdownMenuRadioItem><DropdownMenuRadioItem value="dark"><Moon />Dark</DropdownMenuRadioItem><DropdownMenuRadioItem value="system"><Monitor />System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function ExportMenu() {
  const { analysis: a, responses, source } = useApp();
  const save = (f: Form) => downloadText(`form${f}_${source}${a.sim ? '_SIMULATED' : ''}.csv`, exportCSV(responses[f], f, source !== 'mine'));
  const copy = async () => {
    const text = conclusionsText(a);
    try { await navigator.clipboard.writeText(text); toast.success('Conclusions copied'); } catch { downloadText(`conclusions_${source}.txt`, text, 'text/plain;charset=utf-8'); toast.info('Clipboard is blocked here, so the text was downloaded'); }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline" aria-label="Export"><Download /><span className="max-md:hidden">Export</span></Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={copy} disabled={!a.conclusions.length}><ClipboardCopy />Copy conclusions</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => save('A')} disabled={!responses.A.length}><FileSpreadsheet />Form A responses (CSV)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => save('B')} disabled={!responses.B.length}><FileSpreadsheet />Form B responses (CSV)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function SourceSwitch() {
  const { source } = useApp(), load = useLoadSource();
  return (
    <Toggle.Root type="single" value={source} onValueChange={(v) => v && load(v as Source)} className="flex rounded-lg border bg-muted p-0.5" aria-label="Data set">
      {SOURCES.map((s) => (
        <Tooltip key={s.id} side="bottom" content={`${s.name}: ${s.desc}`}>
          <Toggle.Item value={s.id} className={cn('flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition-colors', source === s.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground')}>
            <JunctionIcon source={s.id} className="size-5 max-sm:hidden" />{s.short}
          </Toggle.Item>
        </Tooltip>
      ))}
    </Toggle.Root>
  );
}
export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { analysis: a, setPresenting } = useApp(), [open, setOpen] = useState(false), empty = !a.m.nA && !a.m.nB;
  return (
    <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <aside className="sticky top-0 hidden h-screen flex-col gap-7 overflow-y-auto border-r bg-card px-3 py-5 lg:flex"><Logo /><NavList route={route} /></aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-card/90 px-4 py-2.5 backdrop-blur sm:px-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation"><Menu /></Button></DialogTrigger>
            <SheetContent side="left" title="IPT Survey Analyser" className="max-w-72"><div className="flex-1 overflow-y-auto px-3 py-4"><NavList route={route} onNavigate={() => setOpen(false)} /></div></SheetContent>
          </Dialog>
          <SourceSwitch />
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground max-xl:hidden" aria-live="polite">{a.sim && <SimBadge />}<span className="truncate">{empty ? 'No responses yet' : `${a.m.nA} operators, ${a.m.nB} road users`}</span></div>
          {a.sim && <span className="xl:hidden"><SimBadge /></span>}
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeMenu /><ExportMenu />
            <Button onClick={() => setPresenting(true)} disabled={empty} aria-label="Present"><Play /><span className="max-md:hidden">Present</span></Button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1320px] px-4 py-6 outline-none sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

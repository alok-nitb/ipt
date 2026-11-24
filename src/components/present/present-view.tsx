import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hideTip } from '@/components/charts/base';
import { PresentContext, SimBadge } from '@/components/panels/parts';
import { buildSections } from '@/components/panels/sections';
import { useApp } from '@/state/app-state';
import { useTheme } from '@/state/use-theme';
import { SOURCE_NAME } from '@/lib/survey';

const BASE = 1240; // design width of a slide; the whole slide is scaled to fit the screen
function FitStage({ id, children }: { id: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null), [s, set] = useState(1);
  useLayoutEffect(() => {
    const fit = () => { if (!box.current || !inner.current) return; const b = box.current, h = inner.current.offsetHeight; set(Math.max(0.4, Math.min(1.9, (b.clientWidth - 64) / BASE, (b.clientHeight - 40) / Math.max(1, h)))); };
    fit();
    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [id]);
  return (
    <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={inner} className="absolute top-1/2 left-1/2" style={{ width: BASE, transform: `translate(-50%,-50%) scale(${s})` }}>{children}</div>
    </div>
  );
}
export function PresentView() {
  const { analysis, setPresenting } = useApp(), { theme, setTheme } = useTheme(), [i, set] = useState(0);
  const slides = buildSections(analysis), n = slides.length, at = Math.min(i, n - 1), slide = slides[at];
  const close = useCallback(() => { hideTip(); setPresenting(false); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }, [setPresenting]);
  const step = useCallback((d: number) => { hideTip(); set((v) => Math.max(0, Math.min(n - 1, v + d))); }, [n]);
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    document.body.style.overflow = 'hidden';
    const fs = () => { if (!document.fullscreenElement) close(); };
    const t = setTimeout(() => document.addEventListener('fullscreenchange', fs), 600);
    return () => { clearTimeout(t); document.removeEventListener('fullscreenchange', fs); document.body.style.overflow = ''; };
  }, [close]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON')) { e.preventDefault(); step(1); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
      else if (e.key === 'Escape') close();
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [step, close]);
  if (!slide) return null;
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'));
  return (
    <PresentContext.Provider value={true}>
      <div className="fixed inset-0 z-40 flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Presentation">
        <div className="h-1 bg-muted"><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${((at + 1) / n) * 100}%` }} /></div>
        <FitStage id={slide.id}>
          <div key={slide.id} className="animate-[fade-in_220ms_ease-out]">
            <p className="text-sm font-medium text-primary">{slide.eyebrow}</p>
            <h2 className="mt-1 text-[26px] leading-tight font-semibold">{slide.title}</h2>
            {slide.sub && <p className="mt-1 text-sm text-muted-foreground">{slide.sub}</p>}
            <div className="mt-5">{slide.body}</div>
          </div>
        </FitStage>
        <div className="flex items-center justify-between gap-4 border-t bg-card px-5 py-2">
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">{analysis.sim && <SimBadge />}<span className="max-sm:hidden">{SOURCE_NAME[analysis.source]}{analysis.sim && ', not field responses'}</span></div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" aria-label="Switch theme" onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <Sun /> : <Moon />}</Button>
            <Button variant="outline" size="icon-sm" aria-label="Previous" disabled={at === 0} onClick={() => step(-1)}><ChevronLeft /></Button>
            <span className="tnum w-16 text-center text-[13px]" aria-live="polite">{at + 1} / {n}</span>
            <Button variant="outline" size="icon-sm" aria-label="Next" disabled={at === n - 1} onClick={() => step(1)}><ChevronRight /></Button>
            <Button variant="ghost" size="sm" onClick={close}><X />Exit</Button>
          </div>
        </div>
      </div>
    </PresentContext.Provider>
  );
}

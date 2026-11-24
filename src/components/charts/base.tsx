import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** element width in layout pixels (not affected by the present-mode scale transform) */
export function useWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
/** false on the first paint, true afterwards: lets marks grow in with a CSS transition */
export function useEntered() {
  const [on, set] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => set(true)); return () => cancelAnimationFrame(id); }, []);
  return on;
}

/* ---------- one shared hover card ---------- */
export interface Tip { title: string; rows?: { label: string; value?: string; color?: string }[] }
let state: (Tip & { x: number; y: number }) | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function showTip(e: { clientX: number; clientY: number }, tip: Tip) { state = { ...tip, x: e.clientX, y: e.clientY }; emit(); }
export function hideTip() { if (state) { state = null; emit(); } }
export const tipProps = (tip: Tip) => ({ onPointerMove: (e: React.PointerEvent) => showTip(e, tip), onPointerLeave: hideTip });

export function ChartTooltip() {
  const t = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!t || !el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    setPos({ left: Math.max(8, Math.min(innerWidth - w - 8, t.x + 14)), top: t.y + h + 24 > innerHeight ? t.y - h - 12 : t.y + 16 });
  }, [t]);
  if (!t) return null;
  return createPortal(
    <div ref={ref} className="pointer-events-none fixed z-[100] max-w-72 rounded-lg border bg-card px-3 py-2 text-[13px] shadow-xl" style={pos}>
      <div className="font-semibold">{t.title}</div>
      {t.rows?.map((r, i) => (
        <div key={i} className="mt-0.5 flex items-center gap-2 text-muted-foreground">
          {r.color && <span className="h-[3px] w-3 shrink-0 rounded-full" style={{ background: r.color }} />}
          <span>{r.label}</span>
          {r.value && <span className="tnum ml-auto pl-3 font-semibold text-foreground">{r.value}</span>}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function Legend({ items, className = '' }: { items: { color: string; label: ReactNode; shape?: 'square' | 'line' | 'dot' | 'ring' }[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span
            className={it.shape === 'line' ? 'h-[3px] w-4 rounded-full' : it.shape === 'dot' ? 'size-2.5 rounded-full' : 'size-2.5 rounded-[3px]'}
            style={it.shape === 'ring' ? { border: `2px solid ${it.color}` } : { background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

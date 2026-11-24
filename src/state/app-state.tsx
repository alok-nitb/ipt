import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { analyse, has, type Analysis, type Form, type Responses, type Row, type Site, type Source } from '@/lib/survey';
import { DATASETS } from '@/lib/datasets';

const KEY = 'ipt-survey-v2';
const SOURCES: Source[] = ['U1', 'U2', 'both', 'mine'];
interface Stored { MINE: Responses; SRC: Source; LVL: number }

function load(): Stored {
  const out: Stored = { MINE: { A: [], B: [] }, SRC: 'U1', LVL: 70 };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s) {
      out.MINE = s.MINE ?? out.MINE;
      out.LVL = s.LVL ?? 70;
      if (SOURCES.includes(s.SRC)) out.SRC = s.SRC;
    } else {
      // keep anything typed into the first version of this page; its simulated pilot is not carried over
      const v = JSON.parse(localStorage.getItem('ipt-survey-v1') ?? 'null');
      if (v && !v.PILOT && (v.DA.length || v.DB.length)) {
        const strip = (r: Row): Row => { const { site: _site, ...rest } = r; return rest; };
        out.MINE.A = v.DA.map(strip);
        out.MINE.B = v.DB.map((r: Row) => {
          const o = strip(r);
          if (has(o.B12)) o.B12 = o.B12 === 0 ? 1 : 0;
          if (Array.isArray(o.B20)) o.B20 = o.B20.filter((i: number) => i !== 5);
          if (has(o.B24) && !Array.isArray(o.B24)) o.B24 = [o.B24];
          return o;
        });
        out.SRC = 'mine';
      }
    }
  } catch { /* storage unavailable */ }
  if (out.SRC === 'mine' && !out.MINE.A.length && !out.MINE.B.length) out.SRC = 'U1';
  return out;
}

interface AppState {
  source: Source; setSource: (s: Source) => void;
  level: number; setLevel: (n: number) => void;
  site: Site | 'all'; setSite: (s: Site | 'all') => void;
  mine: Responses; updateMine: (form: Form, rows: Row[]) => void; clearMine: () => void;
  responses: Responses; analysis: Analysis;
  presenting: boolean; setPresenting: (b: boolean) => void;
}
const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [init] = useState(load);
  const [source, setSourceRaw] = useState<Source>(init.SRC);
  const [level, setLevelRaw] = useState(init.LVL);
  const [site, setSite] = useState<Site | 'all'>('all');
  const [mine, setMine] = useState<Responses>(init.MINE);
  const [presenting, setPresenting] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ MINE: mine, SRC: source, LVL: level })); } catch { /* full or blocked */ } }, [mine, source, level]);
  const setSource = useCallback((s: Source) => { setSourceRaw(s); setSite('all'); }, []);
  const setLevel = useCallback((n: number) => setLevelRaw(Math.max(50, Math.min(95, Math.round(n)))), []);
  const updateMine = useCallback((form: Form, rows: Row[]) => setMine((m) => ({ ...m, [form]: rows })), []);
  const clearMine = useCallback(() => setMine({ A: [], B: [] }), []);
  const responses = source === 'mine' ? mine : DATASETS[source];
  const analysis = useMemo(() => analyse(responses, source, level, site), [responses, source, level, site]);
  const value = useMemo(() => ({ source, setSource, level, setLevel, site, setSite, mine, updateMine, clearMine, responses, analysis, presenting, setPresenting }),
    [source, setSource, level, setLevel, site, mine, updateMine, clearMine, responses, analysis, presenting]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}

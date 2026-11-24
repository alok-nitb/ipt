import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
const KEY = 'ipt-theme';
const media = () => matchMedia('(prefers-color-scheme: dark)');
const read = (): Theme => { try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : 'system'; } catch { return 'system'; } };
const apply = (t: Theme) => document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && media().matches));

export function useTheme() {
  const [theme, set] = useState<Theme>(read);
  useEffect(() => {
    apply(theme);
    if (theme !== 'system') return;
    const m = media(), on = () => apply('system');
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [theme]);
  const setTheme = useCallback((t: Theme) => { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } set(t); }, []);
  return { theme, setTheme };
}

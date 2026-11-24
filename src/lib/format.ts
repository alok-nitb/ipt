export const pct = (x: number | null | undefined, d = 0) => (x == null || !Number.isFinite(x) ? '–' : `${(100 * x).toFixed(d)}%`);
export const num = (x: number | null | undefined, d = 1) => (x == null || !Number.isFinite(x) ? '–' : x.toFixed(d));
export const pText = (p: number | null | undefined) => (p == null ? '–' : p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`);
export const pVal = (p: number | null | undefined) => (p == null ? '–' : p < 0.001 ? '< 0.001' : p.toFixed(3));
/** lower-case the first letter, but leave acronyms such as IPT and UPI alone */
export const lower = (s: string) => (/^.[A-Z0-9]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
export const listOf = (a: string[], w = 'and') => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} ${w} ${a[a.length - 1]}`);

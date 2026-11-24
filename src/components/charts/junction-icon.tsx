import type { Source } from '@/lib/survey';
/** plan-view junction mark: four-arm (U1), T (U2), both, or a form for imported data */
export function JunctionIcon({ source, className = 'size-10' }: { source: Source; className?: string }) {
  const line = { stroke: 'var(--road-line)', strokeWidth: 1.5, strokeDasharray: '3 2.4', fill: 'none' };
  const arm = (d: string) => <path d={d} stroke="var(--c-axis)" strokeWidth={11} fill="none" />;
  if (source === 'mine')
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden>
        <rect width="40" height="40" rx="9" fill="var(--muted)" /><rect x="11" y="8" width="18" height="24" rx="3" fill="var(--card)" stroke="var(--c-axis)" strokeWidth="1.5" />
        <path d="M15 15h10M15 20h10M15 25h6" stroke="var(--c-data)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  const four = source === 'U1', both = source === 'both';
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs><clipPath id={`jc-${source}`}><rect width="40" height="40" rx="9" /></clipPath></defs>
      <g clipPath={`url(#jc-${source})`}>
        <rect width="40" height="40" fill="var(--plot)" />
        {both ? (<>{arm('M0 13h40')}{arm('M13 0v27')}{arm('M27 13v27')}<path d="M0 13h7M33 13h7M27 22v18M13 0v5" {...line} /></>)
          : four ? (<>{arm('M0 20h40')}{arm('M20 0v40')}<path d="M0 20h13M27 20h13M20 0v13M20 27v13" {...line} /></>)
            : (<>{arm('M0 14h40')}{arm('M20 14v26')}<path d="M0 14h13M27 14h13M20 22v18" {...line} /></>)}
        <circle cx={both ? 33 : 29} cy={both ? 10.5 : four ? 17 : 11} r="2.6" fill="var(--c-adverse)" />
        <circle cx={both ? 10 : 17} cy={both ? 24 : 30} r="2.6" fill="var(--c-data)" />
      </g>
    </svg>
  );
}

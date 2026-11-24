import { useEffect, useState } from 'react';

export const ROUTES = ['overview', 'stopping', 'impact', 'distance', 'strategies', 'acceptance', 'compare', 'conclusions', 'form-a', 'form-b', 'tests', 'checks', 'responses'] as const;
export type Route = (typeof ROUTES)[number];
const parse = (): Route => { const r = location.hash.replace(/^#\/?/, '') as Route; return ROUTES.includes(r) ? r : 'overview'; };
export const go = (r: Route) => { location.hash = `/${r}`; };

export function useRoute(): Route {
  const [route, set] = useState<Route>(parse);
  useEffect(() => {
    const on = () => { set(parse()); scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

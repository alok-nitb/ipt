import { Toaster } from 'sonner';
import { ChartTooltip } from '@/components/charts/base';
import { Shell } from '@/components/layout/shell';
import { PresentView } from '@/components/present/present-view';
import { TooltipProvider } from '@/components/ui/controls';
import { AppStateProvider, useApp } from '@/state/app-state';
import { useRoute, type Route } from '@/state/use-route';
import { FormPage } from '@/pages/form-page';
import { ResponsesPage } from '@/pages/responses-page';
import { OverviewPage, SectionPage } from '@/pages/section-page';
import { ChecksPage, TestsPage } from '@/pages/tests-page';

function Page({ route }: { route: Route }) {
  switch (route) {
    case 'overview': return <OverviewPage />;
    case 'form-a': return <FormPage key="A" form="A" />;
    case 'form-b': return <FormPage key="B" form="B" />;
    case 'tests': return <TestsPage />;
    case 'checks': return <ChecksPage />;
    case 'responses': return <ResponsesPage />;
    default: return <SectionPage route={route} />;
  }
}
function Main() {
  const route = useRoute(), { presenting } = useApp();
  return (
    <>
      <Shell route={route}><Page route={route} /></Shell>
      {presenting && <PresentView />}
      <ChartTooltip />
      <Toaster position="bottom-right" toastOptions={{ classNames: { description: 'text-muted-foreground!' }, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)' } }} />
    </>
  );
}
export default function App() {
  return <TooltipProvider delayDuration={250}><AppStateProvider><Main /></AppStateProvider></TooltipProvider>;
}

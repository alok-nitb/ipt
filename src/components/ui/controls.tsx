import { AlertDialog as AD, Checkbox as C, Slider as Sl, Switch as Sw, Tabs as T, ToggleGroup as TG, Tooltip as Tt } from 'radix-ui';
import { Check } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

/* Tabs */
export const Tabs = T.Root;
export const TabsContent = T.Content;
export const TabsList = ({ className, ...p }: ComponentProps<typeof T.List>) => <T.List className={cn('inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1', className)} {...p} />;
export const TabsTrigger = ({ className, ...p }: ComponentProps<typeof T.Trigger>) => (
  <T.Trigger className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card', className)} {...p} />
);
/* Toggle group */
export const ToggleGroup = ({ className, ...p }: ComponentProps<typeof TG.Root>) => <TG.Root className={cn('inline-flex items-center rounded-md border bg-card', className)} {...p} />;
export const ToggleGroupItem = ({ className, ...p }: ComponentProps<typeof TG.Item>) => (
  <TG.Item className={cn('grid h-7 min-w-7 place-items-center px-1.5 text-xs font-medium text-muted-foreground first:rounded-l-md last:rounded-r-md hover:bg-muted data-[state=on]:bg-primary-soft data-[state=on]:text-primary [&_svg]:size-3.5', className)} {...p} />
);
/* Checkbox, switch, slider */
export const Checkbox = ({ className, ...p }: ComponentProps<typeof C.Root>) => (
  <C.Root className={cn('grid size-4 shrink-0 place-items-center rounded border border-input bg-card data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', className)} {...p}><C.Indicator><Check className="size-3" strokeWidth={3} /></C.Indicator></C.Root>
);
export const Switch = ({ className, ...p }: ComponentProps<typeof Sw.Root>) => (
  <Sw.Root className={cn('inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-input p-0.5 transition-colors data-[state=checked]:bg-primary', className)} {...p}><Sw.Thumb className="size-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4" /></Sw.Root>
);
export const Slider = ({ className, label, ...p }: ComponentProps<typeof Sl.Root> & { label: string }) => (
  <Sl.Root className={cn('relative flex h-5 w-full touch-none items-center select-none', className)} {...p}>
    <Sl.Track className="relative h-1.5 grow rounded-full bg-muted"><Sl.Range className="absolute h-full rounded-full bg-primary" /></Sl.Track>
    <Sl.Thumb aria-label={label} className="block size-4.5 rounded-full border-2 border-primary bg-card shadow" />
  </Sl.Root>
);
/* Tooltip */
export const TooltipProvider = Tt.Provider;
export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Tt.Root>
      <Tt.Trigger asChild>{children}</Tt.Trigger>
      <Tt.Portal><Tt.Content side={side} sideOffset={6} className="z-[70] max-w-64 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg data-[state=delayed-open]:animate-[fade-in_120ms]">{content}</Tt.Content></Tt.Portal>
    </Tt.Root>
  );
}
/* Inputs */
const field = 'w-full rounded-md border border-input bg-card px-3 text-sm shadow-card placeholder:text-muted-foreground';
export const Input = ({ className, ...p }: ComponentProps<'input'>) => <input className={cn(field, 'h-9', className)} {...p} />;
export const Textarea = ({ className, ...p }: ComponentProps<'textarea'>) => <textarea className={cn(field, 'min-h-24 py-2', className)} {...p} />;
/* Progress */
export function Progress({ value, className, tone = 'primary' }: { value: number; className?: string; tone?: 'primary' | 'warning' }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-primary-soft', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', tone === 'primary' ? 'bg-data' : 'bg-user')} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
/* Table */
export const Table = ({ className, ...p }: ComponentProps<'table'>) => <div className="overflow-x-auto rounded-lg border"><table className={cn('w-full border-collapse text-sm', className)} {...p} /></div>;
export const Th = ({ className, ...p }: ComponentProps<'th'>) => <th className={cn('border-b bg-muted px-3 py-2 text-left text-xs font-medium text-muted-foreground', className)} {...p} />;
export const Td = ({ className, ...p }: ComponentProps<'td'>) => <td className={cn('border-b px-3 py-2 align-top [tr:last-child>&]:border-b-0', className)} {...p} />;
/* Confirm */
export function Confirm({ trigger, title, description, action, onConfirm }: { trigger: ReactNode; title: string; description: string; action: string; onConfirm: () => void }) {
  return (
    <AD.Root>
      <AD.Trigger asChild>{trigger}</AD.Trigger>
      <AD.Portal>
        <AD.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[fade-in_150ms]" />
        <AD.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-2xl">
          <AD.Title className="text-base font-semibold">{title}</AD.Title>
          <AD.Description className="mt-2 text-sm text-muted-foreground">{description}</AD.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AD.Cancel className={buttonVariants({ variant: 'outline' })}>Cancel</AD.Cancel>
            <AD.Action className={buttonVariants({ variant: 'danger' })} onClick={onConfirm}>{action}</AD.Action>
          </div>
        </AD.Content>
      </AD.Portal>
    </AD.Root>
  );
}

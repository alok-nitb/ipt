import { Dialog as D } from 'radix-ui';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;
const overlay = 'fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[fade-in_150ms] data-[state=closed]:animate-[fade-out_120ms]';

export function DialogContent({ className, children, title, description, ...p }: ComponentProps<typeof D.Content> & { title: ReactNode; description?: ReactNode }) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content {...(description ? {} : { 'aria-describedby': undefined })} className={cn('fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-card shadow-2xl data-[state=open]:animate-[fade-in_150ms]', className)} {...p}>
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <D.Title className="text-base font-semibold">{title}</D.Title>
            {description && <D.Description className="mt-1 text-sm text-muted-foreground">{description}</D.Description>}
          </div>
          <D.Close className="-mr-2 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Close"><X className="size-4" /></D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
export function SheetContent({ className, children, title, side = 'right', description, ...p }: ComponentProps<typeof D.Content> & { title: ReactNode; side?: 'left' | 'right'; description?: ReactNode }) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content {...(description ? {} : { 'aria-describedby': undefined })} className={cn('fixed inset-y-0 z-50 flex w-[calc(100vw-3rem)] max-w-lg flex-col bg-card shadow-2xl', side === 'left' ? 'left-0 border-r data-[state=open]:animate-[slide-left_200ms_ease-out]' : 'right-0 border-l data-[state=open]:animate-[slide-right_200ms_ease-out]', className)} {...p}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <D.Title className="text-base font-semibold">{title}</D.Title>
            {description && <D.Description className="mt-0.5 text-sm text-muted-foreground">{description}</D.Description>}
          </div>
          <D.Close className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Close"><X className="size-4" /></D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}

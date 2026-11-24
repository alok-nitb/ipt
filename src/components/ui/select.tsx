import { Select as S } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export const Select = S.Root;
export const SelectValue = S.Value;
export const SelectTrigger = ({ className, children, ...p }: ComponentProps<typeof S.Trigger>) => (
  <S.Trigger className={cn('flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm shadow-card data-[placeholder]:text-muted-foreground [&>span]:truncate', className)} {...p}>
    {children}<S.Icon><ChevronDown className="size-4 text-muted-foreground" /></S.Icon>
  </S.Trigger>
);
export const SelectContent = ({ className, children, ...p }: ComponentProps<typeof S.Content>) => (
  <S.Portal>
    <S.Content position="popper" sideOffset={4} className={cn('z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border bg-card shadow-lg data-[state=open]:animate-[pop-in_120ms_ease-out]', className)} {...p}>
      <S.Viewport className="p-1">{children}</S.Viewport>
    </S.Content>
  </S.Portal>
);
export const SelectItem = ({ className, children, ...p }: ComponentProps<typeof S.Item>) => (
  <S.Item className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-muted', className)} {...p}>
    <S.ItemText>{children}</S.ItemText><S.ItemIndicator><Check className="size-4 text-primary" /></S.ItemIndicator>
  </S.Item>
);

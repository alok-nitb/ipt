import { DropdownMenu as M } from 'radix-ui';
import { Check } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuRadioGroup = M.RadioGroup;
export const DropdownMenuContent = ({ className, ...p }: ComponentProps<typeof M.Content>) => (
  <M.Portal><M.Content sideOffset={6} align="end" className={cn('z-50 min-w-48 rounded-lg border bg-card p-1 shadow-lg data-[state=open]:animate-[pop-in_120ms_ease-out]', className)} {...p} /></M.Portal>
);
const item = "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
export const DropdownMenuItem = ({ className, ...p }: ComponentProps<typeof M.Item>) => <M.Item className={cn(item, className)} {...p} />;
export const DropdownMenuRadioItem = ({ className, children, ...p }: ComponentProps<typeof M.RadioItem>) => (
  <M.RadioItem className={cn(item, className)} {...p}>{children}<M.ItemIndicator className="ml-auto"><Check /></M.ItemIndicator></M.RadioItem>
);
export const DropdownMenuLabel = ({ className, ...p }: ComponentProps<typeof M.Label>) => <M.Label className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...p} />;
export const DropdownMenuSeparator = () => <M.Separator className="my-1 h-px bg-border" />;

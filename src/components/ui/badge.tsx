import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
const variants = cva("inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3", {
  variants: {
    variant: {
      neutral: 'bg-muted text-muted-foreground',
      primary: 'bg-primary-soft text-primary',
      warning: 'bg-warning-soft text-warning',
      success: 'bg-success-soft text-success',
      danger: 'bg-danger-soft text-danger',
      outline: 'border text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
});
export const Badge = ({ className, variant, ...p }: ComponentProps<'span'> & VariantProps<typeof variants>) => <span className={cn(variants({ variant }), className)} {...p} />;

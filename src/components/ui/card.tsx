import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export const Card = ({ className, ...p }: ComponentProps<'div'>) => <div className={cn('min-w-0 rounded-xl border bg-card shadow-card', className)} {...p} />;
export const CardHeader = ({ className, ...p }: ComponentProps<'div'>) => <div className={cn('flex items-start justify-between gap-3 px-5 pt-4 pb-2', className)} {...p} />;
export const CardTitle = ({ className, ...p }: ComponentProps<'h3'>) => <h3 className={cn('text-[15px] leading-snug font-semibold', className)} {...p} />;
export const CardDescription = ({ className, ...p }: ComponentProps<'p'>) => <p className={cn('text-[13px] text-muted-foreground', className)} {...p} />;
export const CardContent = ({ className, ...p }: ComponentProps<'div'>) => <div className={cn('px-5 pb-5', className)} {...p} />;

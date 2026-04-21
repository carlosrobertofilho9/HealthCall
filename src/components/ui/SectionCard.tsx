import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  className,
  contentClassName,
  headerClassName,
  iconClassName,
  titleClassName,
  children,
  headerActions,
}) => {
  return (
    <div className={cn('flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden rounded-xl border border-border bg-background shadow-sm lg:h-full lg:overflow-hidden lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none', className)}>
      <div className={cn('flex min-w-0 shrink-0 items-center justify-between gap-4 border-b border-border p-6 pb-4', headerClassName)}>
        <h3 className={cn('flex min-w-0 items-center gap-3 text-xl font-bold tracking-tight text-card-foreground', titleClassName)}>
          <div className={cn('flex shrink-0 items-center justify-center rounded-lg border border-border bg-secondary p-2.5 text-muted-foreground shadow-inner', iconClassName)}>
            {icon}
          </div>
          <span className="min-w-0 truncate">{title}</span>
        </h3>
        {headerActions && <div className="shrink-0">{headerActions}</div>}
      </div>

      <div className={cn('flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden p-0 lg:overflow-hidden', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

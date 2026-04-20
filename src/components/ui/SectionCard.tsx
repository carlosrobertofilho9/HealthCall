import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  className,
  contentClassName,
  children,
  headerActions,
}) => {
  return (
    <div className={cn('flex flex-col flex-1 xl:h-full xl:overflow-hidden bg-background xl:bg-transparent rounded-xl border border-border shadow-sm xl:border-0 xl:shadow-none xl:rounded-none', className)}>
      <div className="shrink-0 border-b border-border bg-background/50 p-4 pb-3 lg:p-5 lg:pb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground lg:text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary text-primary shadow-inner">
            {icon}
          </span>
          {title}
        </h3>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col p-0 xl:overflow-hidden', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

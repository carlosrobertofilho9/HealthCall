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
    <div className={cn('flex flex-col flex-1 lg:h-full lg:overflow-hidden bg-background lg:bg-transparent rounded-xl border border-border shadow-sm lg:border-0 lg:shadow-none lg:rounded-none', className)}>
      <div className="shrink-0 border-b border-border p-6 pb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-3 text-xl font-bold tracking-tight text-card-foreground">
          <div className="p-2.5 bg-secondary rounded-lg border border-border shadow-inner flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          {title}
        </h3>
        {headerActions && <div>{headerActions}</div>}
      </div>

      <div className={cn('flex min-h-0 flex-1 flex-col p-0 lg:overflow-hidden', contentClassName)}>
        {children}
      </div>
    </div>
  );
};

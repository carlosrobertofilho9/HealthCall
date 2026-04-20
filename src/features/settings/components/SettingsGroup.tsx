import React from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

type SettingsGroupProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsGroup({
  title,
  description,
  children,
  className,
}: SettingsGroupProps) {
  return (
    <Card className={cn('p-8 border-none shadow-xl bg-card backdrop-blur-sm', className)}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </Card>
  );
}

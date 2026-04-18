import * as React from 'react';
import { cn } from '@/lib/utils';

type ActionBarAlign = 'start' | 'end' | 'between';

export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: ActionBarAlign;
  separated?: boolean;
  stackOnMobile?: boolean;
}

const alignClasses: Record<ActionBarAlign, string> = {
  start: 'justify-start',
  end: 'justify-end',
  between: 'justify-between',
};

export const ActionBar = React.forwardRef<HTMLDivElement, ActionBarProps>(
  ({ className, align = 'end', separated = false, stackOnMobile = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3',
          stackOnMobile ? 'flex-col-reverse sm:flex-row' : 'flex-row',
          alignClasses[align],
          separated && 'mt-2 border-t border-border pt-4',
          className,
        )}
        {...props}
      />
    );
  },
);
ActionBar.displayName = 'ActionBar';

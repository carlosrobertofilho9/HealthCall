import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: React.ReactNode;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, icon, rows = 4, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground">{icon}</span>
        ) : null}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'form-textarea flex min-h-24 w-full rounded-2xl border border-input bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            icon ? 'pl-10' : 'pl-4',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };

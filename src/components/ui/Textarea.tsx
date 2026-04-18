import * as React from 'react';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS } from './design-system';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: React.ReactNode;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, icon, rows = 4, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon ? (
          <span className={cn('pointer-events-none absolute left-3 top-3.5', DS_COLOR.text.muted)}>{icon}</span>
        ) : null}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'form-textarea flex min-h-24 w-full border px-4 py-3 text-sm focus:ring-2 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            DS_COLOR.field.default,
            DS_COLOR.focus.field,
            DS_RADIUS.section,
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

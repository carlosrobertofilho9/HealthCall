import * as React from 'react';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS } from './design-system';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  contentClassName?: string;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({
    className,
    title,
    description,
    icon,
    headerAction,
    contentClassName,
    children,
    ...props
  }, ref) => {
    return (
      <section ref={ref} className={cn(DS_RADIUS.section, DS_COLOR.surface.section, 'border p-4', className)} {...props}>
        {(title || description || headerAction) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? (
                <div className={cn('flex items-center gap-2 text-xs font-medium uppercase tracking-wide', DS_COLOR.text.muted)}>
                  {icon ? <span className="shrink-0">{icon}</span> : null}
                  <span className="truncate">{title}</span>
                </div>
              ) : null}
              {description ? <p className={cn('mt-1 text-sm', DS_COLOR.text.muted)}>{description}</p> : null}
            </div>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>
        )}

        <div className={cn('space-y-3', contentClassName)}>{children}</div>
      </section>
    );
  },
);
FormSection.displayName = 'FormSection';

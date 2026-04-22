import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  desktopContained?: boolean;
  mobileContained?: boolean;
  bottomInset?: boolean;
}

export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, desktopContained = false, mobileContained = false, bottomInset = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full min-w-0 max-w-full overflow-x-hidden bg-background',
          mobileContained
            ? 'app-mobile-contained-shell min-h-0'
            : 'app-mobile-document-shell',
          desktopContained ? 'lg:h-full lg:min-h-0 lg:overflow-hidden' : 'lg:min-h-0 lg:overflow-y-auto',
          bottomInset && 'pb-28 lg:pb-0',
          className,
        )}
        {...props}
      />
    );
  },
);
PageShell.displayName = 'PageShell';

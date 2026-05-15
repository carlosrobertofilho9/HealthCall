import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS } from './design-system';

const badgeVariants = cva(
  `inline-flex items-center ${DS_RADIUS.pill} border px-2 py-0.5 text-[10px] sm:text-xs font-bold leading-none tracking-tight transition-all`,
  {
    variants: {
      variant: {
        default: DS_COLOR.badge.default,
        secondary: DS_COLOR.badge.secondary,
        outline: DS_COLOR.badge.outline,
        success: DS_COLOR.badge.success,
        warning: DS_COLOR.badge.warning,
        destructive: DS_COLOR.badge.destructive,
        muted: DS_COLOR.badge.muted,
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  key?: React.Key;
}

function Badge({ asChild = false, className, variant, children, ...props }: BadgeProps) {
  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(badgeVariants({ variant }), children.props.className, className),
    });
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS } from './design-system';

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${DS_COLOR.focus.visible} disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: `${DS_COLOR.action.primary} font-bold`,
        destructive: `${DS_COLOR.action.destructive} font-bold`,
        secondary: `${DS_COLOR.action.secondary} font-semibold`,
        ghost: DS_COLOR.action.ghost,
      },
      size: {
        default: `${DS_RADIUS.pill} h-14 px-6 text-base`,
        sm: `${DS_RADIUS.section} h-11 px-4 text-sm`,
        icon: `h-10 w-10 ${DS_RADIUS.control} p-0`,
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Um componente de botão reutilizável com variantes de estilo.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

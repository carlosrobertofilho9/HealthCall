import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85 font-bold',
        destructive: 'bg-destructive text-white hover:brightness-110 font-bold',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold',
        ghost: 'bg-transparent text-foreground border border-border hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'rounded-full h-14 px-6 text-base',
        sm: 'rounded-xl h-11 px-4 text-sm',
        icon: 'h-10 w-10 rounded-lg p-0',
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

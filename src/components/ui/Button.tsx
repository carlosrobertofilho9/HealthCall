import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'w-full flex items-center justify-center gap-2 transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-[#122118] hover:bg-opacity-80 font-bold',
        destructive: 'bg-red-700 text-white hover:bg-red-800 font-bold',
        ghost: 'bg-transparent text-white border border-white/10 hover:bg-white/5',
      },
      size: {
        default: 'rounded-full h-14 px-6 text-base',
        sm: 'rounded-xl h-11 px-4 text-sm',
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

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'w-full flex items-center justify-center gap-2 rounded-full h-14 px-6 text-base font-bold transition-all focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-[#122118] hover:bg-opacity-80',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

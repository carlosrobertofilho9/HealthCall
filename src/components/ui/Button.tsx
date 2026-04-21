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
        outline: "border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground backdrop-blur-sm",
        glass: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-xl",
      },
      size: {
        default: `${DS_RADIUS.section} h-12 px-6 text-sm font-bold`,
        sm: `${DS_RADIUS.section} h-10 px-4 text-xs font-semibold`,
        xs: `${DS_RADIUS.section} h-8 px-2.5 text-[10px] uppercase tracking-wider font-bold`,
        lg: `${DS_RADIUS.pill} h-14 px-8 text-lg`,
        icon: `h-10 w-10 ${DS_RADIUS.section} p-0`,
        "icon-sm": `h-8 w-8 ${DS_RADIUS.section} p-0`,
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

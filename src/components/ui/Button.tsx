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

/**
 * Um componente de botão reutilizável com variantes de estilo.
 *
 * Este componente usa `class-variance-authority` para aplicar diferentes estilos
 * com base na propriedade `variant`. Ele encaminha a `ref` para o elemento de botão subjacente
 * e passa todas as outras propriedades de botão padrão.
 *
 * @param {ButtonProps} props As propriedades do componente.
 * @param {React.Ref<HTMLButtonElement>} ref A ref a ser encaminhada para o elemento de botão.
 * @returns {React.ReactElement} O componente de botão renderizado.
 */
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

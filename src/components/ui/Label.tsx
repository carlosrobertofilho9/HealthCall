import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

/**
 * Um componente de rótulo estilizado, construído sobre o Label do Radix UI.
 *
 * Este componente aprimora a tag `<label>` padrão com estilos e acessibilidade
 * aprimorados, cortesia do Radix UI. Ele encaminha a `ref` e as propriedades para o
 * componente `LabelPrimitive.Root`.
 *
 * @param {object} props As propriedades do componente, que são as mesmas do `Label` do Radix UI.
 * @param {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} ref A ref a ser encaminhada para o elemento de rótulo.
 * @returns {React.ReactElement} O componente de rótulo renderizado.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

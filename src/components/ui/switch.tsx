import React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cva } from 'class-variance-authority';
import { DS_COLOR, DS_RADIUS } from './design-system';

const switchVariants = cva(
  `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center ${DS_RADIUS.pill} border-2 ${DS_COLOR.border.transparent} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      checked: {
        true: DS_COLOR.utility.switchChecked,
        false: DS_COLOR.utility.switchUnchecked,
      },
    },
  }
);

/**
 * Um componente de interruptor (toggle switch) estilizado, construído sobre o Switch do Radix UI.
 *
 * Este componente fornece um controle de liga/desliga acessível, com estilos que
 * variam com base em seu estado `checked`. Ele encaminha a `ref` e as propriedades
 * para o componente `SwitchPrimitives.Root` subjacente.
 *
 * @param {object} props As propriedades do componente, que são as mesmas do `Switch` do Radix UI.
 * @param {React.Ref<React.ElementRef<typeof SwitchPrimitives.Root>>} ref A ref a ser encaminhada para o elemento de switch.
 * @returns {React.ReactElement} O componente de switch renderizado.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={switchVariants({ checked: props.checked, className })}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={`pointer-events-none block h-5 w-5 ${DS_RADIUS.pill} ${DS_COLOR.utility.switchThumb} shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0`} />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };

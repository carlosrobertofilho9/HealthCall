import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DS_COLOR, DS_RADIUS } from './design-system';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

/**
 * Um componente de input de texto estilizado.
 *
 * Este componente encapsula o elemento `<input>` padrão do HTML, aplicando um estilo consistente
 * em toda a aplicação. Ele encaminha a `ref` para o elemento de input subjacente
 * e aceita todas as propriedades de input padrão.
 *
 * @param {InputProps} props As propriedades do componente.
 * @param {React.Ref<HTMLInputElement>} ref A ref a ser encaminhada para o elemento de input.
 * @returns {React.ReactElement} O componente de input renderizado.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className={cn('pointer-events-none absolute left-4 top-1/2 -translate-y-1/2', DS_COLOR.text.muted)}>
            {icon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            'form-input w-full border h-11 pr-4 focus:ring-2 transition-all focus:outline-none',
            DS_COLOR.field.default,
            DS_COLOR.focus.field,
            DS_RADIUS.pill,
            icon ? 'pl-12' : 'pl-4',
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };

import * as React from 'react';
import { Search } from 'lucide-react';

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
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9]">
          {icon ?? <Search className="h-4 w-4" />}
        </span>
        <input
          type={type}
          className={`form-input w-full rounded-full text-white bg-[#264532] border-none h-11 pl-12 pr-4 placeholder:text-[#96c5a9] focus:ring-2 focus:ring-primary transition-all focus:outline-none ${className}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };

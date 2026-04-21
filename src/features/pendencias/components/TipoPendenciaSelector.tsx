import React from 'react';
import { Tag } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TipoPendenciaSelectorProps {
  options: string[];
  selectedTipos: string[];
  tipoPersonalizado: string;
  onToggleTipo: (tipo: string) => void;
  onChangeTipoPersonalizado: (value: string) => void;
  inputPlaceholder?: string;
}

export const TipoPendenciaSelector: React.FC<TipoPendenciaSelectorProps> = ({
  options,
  selectedTipos,
  tipoPersonalizado,
  onToggleTipo,
  onChangeTipoPersonalizado,
  inputPlaceholder = 'Outro tipo personalizado',
}) => {
  return (
    <div className="space-y-3 lg:space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-1.5">
        {options.map((tipoOption) => {
          const isChecked = selectedTipos.includes(tipoOption);
          return (
            <label
              key={tipoOption}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition-all lg:rounded-md lg:px-2.5 lg:py-1.5',
                isChecked
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground hover:border-primary/40',
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleTipo(tipoOption)}
                className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary"
              />
              <span className="text-sm font-semibold lg:text-xs">{tipoOption}</span>
            </label>
          );
        })}
      </div>

      <Input
        value={tipoPersonalizado}
        onChange={(event) => onChangeTipoPersonalizado(event.target.value)}
        placeholder={inputPlaceholder}
        icon={<Tag className="h-4 w-4" />}
        className="h-11 lg:h-10"
      />
    </div>
  );
};

import React from 'react';
import { Tag } from 'lucide-react';
import { DS_COLOR, DS_RADIUS, Input } from '@/components/ui';
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((tipoOption) => {
          const isChecked = selectedTipos.includes(tipoOption);
          return (
            <label
              key={tipoOption}
              className={cn(
                'flex items-center gap-2 border px-3 py-2 cursor-pointer transition-all',
                DS_RADIUS.control,
                isChecked
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : `${DS_COLOR.border.default} bg-input text-foreground hover:border-primary/50`,
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleTipo(tipoOption)}
                className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{tipoOption}</span>
            </label>
          );
        })}
      </div>

      <Input
        value={tipoPersonalizado}
        onChange={(event) => onChangeTipoPersonalizado(event.target.value)}
        placeholder={inputPlaceholder}
        icon={<Tag className="h-4 w-4" />}
        className={cn('h-11', DS_RADIUS.section)}
      />
    </>
  );
};

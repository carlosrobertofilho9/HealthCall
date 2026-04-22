import React from 'react';
import { Check, Tag } from 'lucide-react';
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
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((tipoOption) => {
          const isChecked = selectedTipos.includes(tipoOption);
          return (
            <label
              key={tipoOption}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[0.95rem] border px-3 py-2 text-sm font-bold transition-all active:scale-[0.99]',
                isChecked
                  ? 'border-[#BFE8DF] bg-[#E6F7F2] text-[#007A65] shadow-[0_8px_18px_rgba(0,187,148,0.08)]'
                  : 'border-[#DCE5EE] bg-white text-[#001B3D] hover:border-[#BFD8FF] hover:bg-[#F8FAFC]',
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleTipo(tipoOption)}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-[0.45rem] border transition-colors',
                  isChecked
                    ? 'border-[#00BB94] bg-[#00BB94] text-white'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] text-transparent',
                )}
              >
                <Check className="size-3.5" />
              </span>
              <span className="min-w-0 truncate">{tipoOption}</span>
            </label>
          );
        })}
      </div>

      <Input
        value={tipoPersonalizado}
        onChange={(event) => onChangeTipoPersonalizado(event.target.value)}
        placeholder={inputPlaceholder}
        icon={<Tag className="h-4 w-4" />}
        className="h-12 border-[#DCE5EE] bg-white text-sm font-semibold text-[#001B3D] placeholder:text-[#64748B] focus:ring-[#00BB94]/20"
      />
    </div>
  );
};

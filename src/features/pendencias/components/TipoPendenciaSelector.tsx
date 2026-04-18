import React from 'react';
import { Input } from '@/components/ui/Input';

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
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                isChecked
                  ? 'border-green-400/40 bg-green-500/10 text-green-200'
                  : 'border-white/10 bg-[#1f3a2b] text-white hover:border-[#96c5a9]/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleTipo(tipoOption)}
                className="h-4 w-4 rounded border-white/20 bg-[#264532] text-primary focus:ring-primary"
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
        className="h-11 rounded-xl pl-4 bg-[#1f3a2b]"
      />
    </>
  );
};

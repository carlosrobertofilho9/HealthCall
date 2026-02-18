import React, { useState } from 'react';
import { Ban, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

interface BlockDayModalProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
  date: Date;
}

export const BlockDayModal: React.FC<BlockDayModalProps> = ({
  onConfirm,
  onClose,
  isLoading,
  date,
}) => {
  const [reasonType, setReasonType] = useState<string>('Reunião');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = reasonType === 'Outros' ? customReason : reasonType;
    if (!finalReason.trim()) return;
    onConfirm(finalReason);
  };

  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#1a2c22] rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Ban className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Bloquear Dia</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#264532] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">
              Isso irá preencher todos os horários vazios de <strong>{formattedDate}</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">
              Motivo do Bloqueio
            </label>
            <Select value={reasonType} onValueChange={setReasonType}>
              <SelectTrigger className="w-full h-12 bg-[#264532] border-0 text-white rounded-xl">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2c22] border-[#264532]">
                <SelectItem value="Reunião" className="text-white hover:bg-[#264532] focus:bg-[#264532]">Reunião</SelectItem>
                <SelectItem value="Férias" className="text-white hover:bg-[#264532] focus:bg-[#264532]">Férias</SelectItem>
                <SelectItem value="Outros" className="text-white hover:bg-[#264532] focus:bg-[#264532]">Outros</SelectItem>
              </SelectContent>
            </Select>

            {reasonType === 'Outros' && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Digite o motivo..."
                  className="bg-[#264532] border-0 text-white placeholder:text-gray-500 h-12 rounded-xl"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl bg-[#264532] text-white font-semibold hover:bg-[#305a3e] transition-colors"
            >
              Cancelar
            </button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || (reasonType === 'Outros' && !customReason.trim())}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold border-0"
            >
              {isLoading ? 'Bloqueando...' : 'Confirmar Bloqueio'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

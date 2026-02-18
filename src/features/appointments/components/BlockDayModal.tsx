import React, { useMemo, useState } from 'react';
import { 
  Ban, 
  X, 
  AlertTriangle,
  Calendar,
  Plane,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import type { DayScheduleConfig } from '@/types';
import { getSlotTime } from '../services/appointmentService';

interface BlockDayModalProps {
  onConfirm: (reason: string, startSlot?: number, endSlot?: number) => void;
  onClose: () => void;
  isLoading: boolean;
  date: Date;
  dayConfig: DayScheduleConfig;
}

export const BlockDayModal: React.FC<BlockDayModalProps> = ({
  onConfirm,
  onClose,
  isLoading,
  date,
  dayConfig,
}) => {
  const [reasonType, setReasonType] = useState<string>('Reunião');
  const [customReason, setCustomReason] = useState('');
  const [startSlotStr, setStartSlotStr] = useState<string>('1');
  const [endSlotStr, setEndSlotStr] = useState<string>(dayConfig.totalSlots.toString());

  const formattedDate = useMemo(
    () =>
      date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [date],
  );

  const slotOptions = useMemo(() => {
    return Array.from({ length: dayConfig.totalSlots }, (_, i) => {
      const slotNum = i + 1;
      const time = getSlotTime(slotNum, dayConfig);
      return { value: slotNum.toString(), label: `${slotNum} · ${time}` };
    });
  }, [dayConfig]);

  const startSlot = useMemo(() => parseInt(startSlotStr, 10), [startSlotStr]);
  const endSlot = useMemo(() => parseInt(endSlotStr, 10), [endSlotStr]);

  const isRangeInvalid = startSlot > endSlot;
  const isFullDay = startSlotStr === '1' && endSlotStr === dayConfig.totalSlots.toString();

  const startTime = useMemo(() => getSlotTime(startSlot, dayConfig), [startSlot, dayConfig]);
  const endTime = useMemo(() => getSlotTime(endSlot, dayConfig), [endSlot, dayConfig]);

  const finalReason = reasonType === 'Outros' ? customReason : reasonType;
  const isReasonInvalid = !finalReason.trim();

  const handleConfirm = () => {
    if (isReasonInvalid || isRangeInvalid) return;
    onConfirm(finalReason.trim(), startSlot, endSlot);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="min-h-full p-4 flex items-end sm:items-center justify-center">
        <div className="w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl bg-[#1a2c22] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-none">
                    Bloquear agenda
                  </h3>
                  <p className="text-sm text-gray-300 capitalize">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Alert / Summary */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-red-100">
                    {isFullDay ? (
                      <>
                        Você vai bloquear <strong>todos</strong> os horários vazios do dia.
                      </>
                    ) : (
                      <>
                        Você vai bloquear os horários vazios do intervalo selecionado.
                      </>
                    )}
                  </p>

                  <p className="text-xs text-red-200/90">
                    <span className="font-medium">Intervalo:</span>{' '}
                    {startSlot} ({startTime}) → {endSlot} ({endTime})
                  </p>
                </div>
              </div>
            </div>

            {/* Interval */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-white">Intervalo</h4>
                {!isFullDay && (
                  <span className="text-xs text-gray-300">
                    Selecione as fichas
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select value={startSlotStr} onValueChange={setStartSlotStr}>
                    <SelectTrigger className="w-full h-11 bg-[#264532] border border-white/5 text-white rounded-xl">
                      <SelectValue placeholder="Início" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2c22] border-[#264532] max-h-64">
                      {slotOptions.map((opt) => (
                        <SelectItem
                          key={`start-${opt.value}`}
                          value={opt.value}
                          className="text-white hover:bg-[#264532] focus:bg-[#264532]"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Select value={endSlotStr} onValueChange={setEndSlotStr}>
                    <SelectTrigger className="w-full h-11 bg-[#264532] border border-white/5 text-white rounded-xl">
                      <SelectValue placeholder="Fim" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2c22] border-[#264532] max-h-64">
                      {slotOptions.map((opt) => (
                        <SelectItem
                          key={`end-${opt.value}`}
                          value={opt.value}
                          className="text-white hover:bg-[#264532] focus:bg-[#264532]"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isRangeInvalid && (
                <p className="text-xs text-red-200">
                  A ficha inicial não pode ser maior que a ficha final.
                </p>
              )}
            </section>

            {/* Motivo com ícones */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Motivo</h4>

              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger className="w-full h-11 bg-[#264532] border border-white/5 text-white rounded-xl">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {reasonType === 'Reunião' && <Calendar className="w-4 h-4 text-gray-300" />}
                      {reasonType === 'Férias' && <Plane className="w-4 h-4 text-gray-300" />}
                      {reasonType === 'Outros' && <FileText className="w-4 h-4 text-gray-300" />}
                      <span>{reasonType}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="bg-[#1a2c22] border-[#264532]">
                  <SelectItem value="Reunião" className="text-white hover:bg-[#264532] focus:bg-[#264532]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-300" />
                      Reunião
                    </div>
                  </SelectItem>

                  <SelectItem value="Férias" className="text-white hover:bg-[#264532] focus:bg-[#264532]">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-gray-300" />
                      Férias
                    </div>
                  </SelectItem>

                  <SelectItem value="Outros" className="text-white hover:bg-[#264532] focus:bg-[#264532]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-300" />
                      Outros
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {reasonType === 'Outros' && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <Input
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    className="bg-[#264532] border border-white/5 text-white placeholder:text-gray-400 h-11 rounded-xl"
                    autoFocus
                  />
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#1a2c22]">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex-1 text-white px-0"
              >
                Cancelar
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirm}
                disabled={isLoading || isReasonInvalid || isRangeInvalid}
                className="flex-1 px-0"
              >
                {isLoading ? 'Bloqueando…' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
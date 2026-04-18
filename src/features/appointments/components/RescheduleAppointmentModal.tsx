import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { Appointment } from '@/types';
import {
  formatDateToISO,
  getAvailableSlots,
  getDayConfig,
  getSlotTime,
  parseISODate,
} from '../services/appointmentService';

interface RescheduleAppointmentModalProps {
  appointment: Appointment;
  onConfirm: (id: string, scheduledDate: string, slotNumber: number) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [dateValue, setDateValue] = useState(appointment.scheduled_date);
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [slotNumber, setSlotNumber] = useState<number | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalConfig = useMemo(
    () => getDayConfig(parseISODate(appointment.scheduled_date)),
    [appointment.scheduled_date]
  );
  const selectedDate = useMemo(() => parseISODate(dateValue), [dateValue]);
  const selectedConfig = useMemo(() => getDayConfig(selectedDate), [selectedDate]);
  const canUseSelectedDate =
    selectedConfig.hasService && selectedConfig.serviceType === originalConfig.serviceType;

  useEffect(() => {
    let isMounted = true;

    const loadSlots = async () => {
      setSlotNumber(null);
      setAvailableSlots([]);

      if (!canUseSelectedDate) {
        setError(
          selectedConfig.hasService
            ? 'Selecione uma data com o mesmo tipo de atendimento da marcação original.'
            : 'Esta data não possui atendimento.'
        );
        return;
      }

      setIsLoadingSlots(true);
      setError(null);
      try {
        const slots = await getAvailableSlots(selectedDate);
        if (!isMounted) return;
        setAvailableSlots(slots);
        setSlotNumber(slots[0] ?? null);
        if (slots.length === 0) {
          setError('Não há slots disponíveis nesta data.');
        }
      } catch (err) {
        console.error('Erro ao carregar slots para remarcação:', err);
        if (isMounted) {
          setError('Erro ao carregar slots disponíveis.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [canUseSelectedDate, selectedConfig.hasService, selectedDate, originalConfig.serviceType]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!slotNumber) {
      setError('Selecione um slot disponível.');
      return;
    }

    const success = await onConfirm(appointment.id, dateValue, slotNumber);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[#1a2c22] p-5 safe-area-bottom sm:max-w-md sm:rounded-2xl sm:p-6">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white sm:text-xl">Remarcar</h3>
            <p className="mt-1 text-sm text-[#96c5a9]">{appointment.patient_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2.5 transition-colors hover:bg-[#264532] active:bg-[#264532]"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-[#264532] bg-[#122118]/40 p-3 text-sm text-[#96c5a9]">
            Ficha atual: <span className="font-bold text-white">{appointment.slot_number}</span> em{' '}
            <span className="font-bold text-white">
              {parseISODate(appointment.scheduled_date).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <div>
            <Label className="mb-2 block text-white">Nova data *</Label>
            <div className="relative">
              <CalendarClock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#96c5a9]" />
              <Input
                type="date"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                min={formatDateToISO(new Date())}
                className="pl-12"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-white">Novo slot *</Label>
            <Select
              value={slotNumber?.toString() ?? ''}
              onValueChange={(value) => setSlotNumber(Number(value))}
              disabled={isLoadingSlots || availableSlots.length === 0 || !canUseSelectedDate}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingSlots ? 'Carregando...' : 'Selecione um slot'} />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map(slot => (
                  <SelectItem key={slot} value={slot.toString()}>
                    Slot {slot} - {getSlotTime(slot, selectedConfig)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-[#264532] px-4 py-3.5 font-semibold text-white transition-colors hover:bg-[#305a3e] active:bg-[#305a3e]"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={isLoading || isLoadingSlots || !slotNumber || !canUseSelectedDate}
              className="flex-1 py-3.5"
            >
              {isLoading ? 'Remarcando...' : 'Remarcar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleAppointmentModal;

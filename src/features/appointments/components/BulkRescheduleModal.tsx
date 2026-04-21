import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, X } from 'lucide-react';
import { Button, DatePicker, Label, Modal } from '@/components/ui';
import type { Appointment, DayScheduleConfig } from '@/types';
import {
  formatDateForDisplay,
  formatDateToISO,
  getDayConfig,
  getSlotTime,
  parseISODate,
} from '../services/appointmentService';

interface BulkRescheduleModalProps {
  sourceDate: Date;
  sourceConfig: DayScheduleConfig;
  appointments: Appointment[];
  onConfirm: (targetDate: string) => Promise<boolean>;
  onClose: () => void;
  isLoading: boolean;
}

const findInitialTargetDate = (sourceDate: Date, sourceConfig: DayScheduleConfig) => {
  const candidate = new Date(sourceDate);

  for (let i = 1; i <= 14; i++) {
    candidate.setDate(candidate.getDate() + 1);
    const candidateConfig = getDayConfig(candidate);

    if (candidateConfig.hasService && candidateConfig.serviceType === sourceConfig.serviceType) {
      return formatDateToISO(candidate);
    }
  }

  return '';
};

export const BulkRescheduleModal: React.FC<BulkRescheduleModalProps> = ({
  sourceDate,
  sourceConfig,
  appointments,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const [targetDate, setTargetDate] = useState(() => findInitialTargetDate(sourceDate, sourceConfig));

  const selectedTargetDate = useMemo(
    () => (targetDate ? parseISODate(targetDate) : null),
    [targetDate]
  );

  const targetConfig = useMemo(
    () => (selectedTargetDate ? getDayConfig(selectedTargetDate) : null),
    [selectedTargetDate]
  );

  const validationMessage = useMemo(() => {
    if (!targetDate || !selectedTargetDate || !targetConfig) {
      return 'Selecione uma data de destino.';
    }

    if (formatDateToISO(sourceDate) === targetDate) {
      return 'A data de destino deve ser diferente da data original.';
    }

    if (!targetConfig.hasService) {
      return 'A data de destino não possui atendimento.';
    }

    if (targetConfig.serviceType !== sourceConfig.serviceType) {
      return 'Selecione uma data com o mesmo tipo de atendimento da agenda original.';
    }

    if (appointments.length === 0) {
      return 'Não há pacientes agendados para reagendar nesta data.';
    }

    const invalidSlots = appointments
      .filter(appointment => appointment.slot_number > targetConfig.totalSlots)
      .map(appointment => appointment.slot_number);

    if (invalidSlots.length > 0) {
      return `A agenda de destino não possui as fichas ${invalidSlots.join(', ')}.`;
    }

    return null;
  }, [appointments, selectedTargetDate, sourceConfig.serviceType, sourceDate, targetConfig, targetDate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validationMessage) {
      return;
    }

    const success = await onConfirm(targetDate);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      position="bottom"
      showMobileHandle
      panelClassName="max-h-[92vh] overflow-y-auto p-5 sm:max-w-xl sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-2">
            <CalendarDays className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-card-foreground sm:text-xl">Reagendar dia</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateForDisplay(sourceDate)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-100">
                Os pacientes agendados serão movidos e a agenda original ficará como remarcada no histórico.
              </p>
              <p className="text-xs text-amber-100/80">
                As fichas serão preservadas. Se qualquer ficha já estiver ocupada no destino, ninguém será movido.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Pacientes</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{appointments.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Tipo</p>
            <p className="mt-1 text-sm font-semibold text-card-foreground">{sourceConfig.serviceLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Fichas</p>
            <p className="mt-1 text-sm font-semibold text-card-foreground">
              {appointments.length > 0
                ? appointments.map(appointment => appointment.slot_number).join(', ')
                : 'Nenhuma'}
            </p>
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-card-foreground">Nova data *</Label>
          <DatePicker
            value={targetDate}
            onChange={setTargetDate}
            className="pl-12"
            icon={<CalendarDays className="h-4 w-4" />}
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-card-foreground">Prévia dos pacientes</h4>
            <span className="text-xs text-muted-foreground">Ficha · Paciente · ACS</span>
          </div>

          {appointments.length > 0 ? (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid grid-cols-[72px_1fr] gap-3 border-b border-border p-3 last:border-b-0 sm:grid-cols-[88px_1fr_140px]"
                >
                  <div className="text-sm font-bold text-primary">
                    {appointment.slot_number}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      {getSlotTime(appointment.slot_number, sourceConfig)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">{appointment.patient_name}</p>
                    <p className="truncate text-xs text-muted-foreground sm:hidden">{appointment.acs_name}</p>
                  </div>
                  <p className="hidden truncate text-sm text-muted-foreground sm:block">{appointment.acs_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              Não há pacientes com status Agendado nesta data.
            </div>
          )}
        </section>

        {validationMessage && <p className="text-sm text-red-300">{validationMessage}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-secondary px-4 py-3.5 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 active:bg-secondary/90"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            disabled={isLoading || Boolean(validationMessage)}
            className="flex-1 py-3.5"
          >
            {isLoading ? 'Reagendando...' : 'Confirmar reagendamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkRescheduleModal;

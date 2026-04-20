import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarClock } from 'lucide-react';
import { DS_RADIUS, DatePicker } from '@/components/ui';
import { getDayConfig } from '../services/appointmentService';
import type { DayScheduleConfig } from '@/types';

interface DateSelectorProps {
  selectedDate: Date;
  dayConfig: DayScheduleConfig;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onDateChange: (date: Date) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Componente para selecionar a data das marcações.
 * Refatorado para utilizar o componente genérico DatePicker, mantendo a navegação customizada.
 */
export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  dayConfig,
  onPreviousDay,
  onNextDay,
  onToday,
  onDateChange,
}) => {
  const isTodayValue = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const formatWeekday = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const serviceSummary = dayConfig.hasService
    ? dayConfig.serviceType === 'HOME_VISIT'
      ? `${dayConfig.totalSlots} visitas domiciliares`
      : `${dayConfig.totalSlots} vagas disponíveis`
    : 'Sem atendimento';

  const isoValue = selectedDate.toISOString().slice(0, 10);

  return (
    <div className={`${DS_RADIUS.surface} border border-border bg-card p-4 sm:p-5 print:border-gray-300 print:bg-white`}>
      <div className="flex flex-col gap-4">
        <div className={`${DS_RADIUS.section} bg-card p-3 sm:p-4`}>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onPreviousDay}
              className={`w-auto shrink-0 ${DS_RADIUS.section} bg-transparent p-2.5 text-card-foreground transition-colors hover:bg-secondary/40 print:hidden`}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>

            <DatePicker
              value={isoValue}
              onChange={(val) => {
                const [y, m, d] = val.split('-').map(Number);
                onDateChange(new Date(y, m - 1, d, 12, 0, 0, 0));
              }}
              renderDay={(date, isSelected, isToday, selectable) => {
                const config = getDayConfig(date);
                const hasService = config.hasService;
                return (
                  <div className="flex flex-col items-center">
                    <span className="text-base">{date.getDate()}</span>
                    {hasService && !isSelected && (
                      <span className={`w-1.5 h-1.5 ${DS_RADIUS.pill} bg-primary mt-0.5`} />
                    )}
                  </div>
                );
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={open}
                  className={`${DS_RADIUS.section} bg-transparent px-3 py-3 text-center transition-colors hover:bg-secondary/30 print:bg-transparent w-full`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
                    {formatWeekday(selectedDate)}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-card-foreground sm:text-3xl print:text-black">
                    {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
                  </h2>
                  <p className={`mt-1 text-xs font-medium sm:text-sm ${dayConfig.hasService ? 'text-muted-foreground' : 'text-red-400'} print:text-gray-500`}>
                    {serviceSummary}
                  </p>
                </button>
              )}
            </DatePicker>

            <button
              type="button"
              onClick={onNextDay}
              className={`w-auto shrink-0 ${DS_RADIUS.section} bg-transparent p-2.5 text-card-foreground transition-colors hover:bg-secondary/40 print:hidden`}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center">
            <span className={`${DS_RADIUS.pill} border px-3 py-1 text-xs font-semibold ${isTodayValue() ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-secondary/60 text-muted-foreground'}`}>
              {isTodayValue() ? 'Hoje' : 'Dia selecionado'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 print:hidden">
          <DatePicker
            value={isoValue}
            onChange={(val) => {
              const [y, m, d] = val.split('-').map(Number);
              onDateChange(new Date(y, m - 1, d, 12, 0, 0, 0));
            }}
            renderDay={(date, isSelected, isToday, selectable) => {
              const config = getDayConfig(date);
              const hasService = config.hasService;
              return (
                <div className="flex flex-col items-center">
                  <span className="text-base">{date.getDate()}</span>
                  {hasService && !isSelected && (
                    <span className={`w-1.5 h-1.5 ${DS_RADIUS.pill} bg-primary mt-0.5`} />
                  )}
                </div>
              );
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={open}
                className={`inline-flex h-11 items-center justify-center gap-2 ${DS_RADIUS.section} border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 w-full`}
              >
                <Calendar className="h-4 w-4" />
                <span>Calendário</span>
              </button>
            )}
          </DatePicker>

          <button
            type="button"
            onClick={onToday}
            disabled={isTodayValue()}
            className={`h-11 ${DS_RADIUS.section} bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Ir para Hoje
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarClock } from 'lucide-react';
import { DatePicker } from '@/components/ui';
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
    <div className="overflow-hidden rounded-[1.35rem] border border-white/80 bg-white shadow-[0_16px_44px_rgba(0,27,61,0.06)] print:border-gray-300 print:bg-white">
      <div className="border-b border-[#EEF3F7] px-4 py-4">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#007A65]">
          <CalendarClock className="size-4" />
          Controle da data
        </div>
        <p className="mt-1 text-sm font-semibold text-[#64748B]">Selecione o dia operacional da agenda.</p>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="rounded-[1.15rem] border border-[#DCE5EE] bg-[#F8FAFC] p-3 sm:p-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onPreviousDay}
              className="w-auto shrink-0 rounded-[0.9rem] bg-white p-2.5 text-[#001B3D] shadow-[0_8px_18px_rgba(0,27,61,0.05)] transition-colors hover:bg-[#E6F7F2] print:hidden"
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
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#00BB94]" />
                    )}
                  </div>
                );
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={open}
                  className="w-full rounded-[1rem] bg-white px-3 py-4 text-center shadow-[0_10px_24px_rgba(0,27,61,0.04)] transition-colors hover:bg-[#FDFEFF] print:bg-transparent"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#007A65] sm:text-sm">
                    {formatWeekday(selectedDate)}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#001B3D] sm:text-3xl print:text-black">
                    {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
                  </h2>
                  <p className={`mt-1 text-xs font-semibold sm:text-sm ${dayConfig.hasService ? 'text-[#64748B]' : 'text-[#B42318]'} print:text-gray-500`}>
                    {serviceSummary}
                  </p>
                </button>
              )}
            </DatePicker>

            <button
              type="button"
              onClick={onNextDay}
              className="w-auto shrink-0 rounded-[0.9rem] bg-white p-2.5 text-[#001B3D] shadow-[0_8px_18px_rgba(0,27,61,0.05)] transition-colors hover:bg-[#E6F7F2] print:hidden"
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center">
            <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${isTodayValue() ? 'border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65]' : 'border-[#DCE5EE] bg-white text-[#64748B]'}`}>
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
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#00BB94]" />
                  )}
                </div>
              );
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={open}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[0.95rem] border border-[#DCE5EE] bg-[#F8FAFC] px-4 text-sm font-extrabold text-[#001B3D] transition-colors hover:border-[#BFD2E5] hover:bg-white"
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
            className="h-11 rounded-[0.95rem] bg-[#00BB94] px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(0,187,148,0.18)] transition-opacity hover:bg-[#00A885] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ir para Hoje
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { Modal } from '@/components/ui';
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

// Nomes dos dias da semana em português
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Componente para selecionar a data das marcações.
 * Permite navegar entre dias e selecionar uma data específica via calendário customizado.
 */
export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  dayConfig,
  onPreviousDay,
  onNextDay,
  onToday,
  onDateChange,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  // Atualizar viewDate quando selectedDate mudar
  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate]);

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isTodayDate = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  // Gerar dias do mês para o calendário
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Preencher dias vazios antes do primeiro dia
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Preencher dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  const formatWeekday = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const serviceSummary = dayConfig.hasService
    ? dayConfig.serviceType === 'HOME_VISIT'
      ? `${dayConfig.totalSlots} visitas domiciliares`
      : `${dayConfig.totalSlots} vagas disponíveis`
    : 'Sem atendimento';

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 print:border-gray-300 print:bg-white">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-card p-3 sm:p-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onPreviousDay}
              className="w-auto shrink-0 rounded-xl bg-transparent p-2.5 text-card-foreground transition-colors hover:bg-secondary/40 print:hidden"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="rounded-xl bg-transparent px-3 py-3 text-center transition-colors hover:bg-secondary/30 print:bg-transparent"
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

            <button
              type="button"
              onClick={onNextDay}
              className="w-auto shrink-0 rounded-xl bg-transparent p-2.5 text-card-foreground transition-colors hover:bg-secondary/40 print:hidden"
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isToday() ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-secondary/60 text-muted-foreground'}`}>
              {isToday() ? 'Hoje' : 'Dia selecionado'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 print:hidden">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
          >
            <Calendar className="h-4 w-4" />
            <span>Calendário</span>
          </button>

          <button
            type="button"
            onClick={onToday}
            disabled={isToday()}
            className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ir para Hoje
          </button>
        </div>
      </div>

      {/* Modal do Calendário */}
      {isCalendarOpen && (
        <Modal
          isOpen
          onClose={() => setIsCalendarOpen(false)}
          position="bottom"
          overlayClassName="p-0 sm:p-4"
          panelClassName="w-full overflow-hidden animate-slide-up sm:w-auto sm:min-w-85 sm:max-w-100"
        >
            <div className="flex items-center justify-between border-b border-border p-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="rounded-xl p-2 text-card-foreground transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h3 className="text-lg font-bold text-card-foreground">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-xl p-2 text-card-foreground transition-colors hover:bg-secondary"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 p-3 pb-0">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 p-3">
              {generateCalendarDays().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isTodayDate(date);
                const config = getDayConfig(date);
                const hasService = config.hasService;

                return (
                  <button
                    type="button"
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center
                      text-sm font-medium transition-all
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground scale-105' 
                        : isCurrentDay
                          ? 'bg-secondary text-primary ring-2 ring-primary'
                          : hasService
                            ? 'text-card-foreground hover:bg-secondary'
                            : 'text-muted-foreground/50 hover:bg-secondary/50'
                      }
                    `}
                  >
                    <span className="text-base">{date.getDate()}</span>
                    {hasService && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 pt-2 border-t border-border">
              <div className="mb-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Com atendimento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  <span className="text-muted-foreground">Sem atendimento</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                <span className="inline-flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Fechar
                </span>
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default DateSelector;

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { DS_RADIUS, Button, Modal } from '@/components/ui';
import {
  DOCUMENTS_MAX_FUTURE_DAYS,
  clampIsoDateToFutureRange,
  getTodayIsoDate,
  parseIsoDateLocal,
  toIsoDateLocal,
} from '../utils/dateSequence';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface DocumentDateSelectorProps {
  value?: string;
  onChange: (nextValue: string) => void;
}

export const DocumentDateSelector: React.FC<DocumentDateSelectorProps> = ({ value, onChange }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const selectedIsoDate = useMemo(() => {
    const fallback = getTodayIsoDate();
    return value ? clampIsoDateToFutureRange(value) : fallback;
  }, [value]);

  const selectedDate = useMemo(() => {
    return parseIsoDateLocal(selectedIsoDate) ?? new Date();
  }, [selectedIsoDate]);

  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate]);

  const today = useMemo(() => parseIsoDateLocal(getTodayIsoDate()) ?? new Date(), []);
  const maxDate = useMemo(() => {
    const future = new Date(today);
    future.setDate(future.getDate() + DOCUMENTS_MAX_FUTURE_DAYS);
    return future;
  }, [today]);

  const formatDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const isSameDay = (dateA: Date, dateB: Date) => {
    return (
      dateA.getDate() === dateB.getDate() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getFullYear() === dateB.getFullYear()
    );
  };

  const isSelectableDate = (date: Date) => {
    return date >= today && date <= maxDate;
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<Date | null> = [];

    for (let i = 0; i < firstDay.getDay(); i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(new Date(year, month, day));
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
    if (!isSelectableDate(date)) return;
    onChange(toIsoDateLocal(date));
    setIsCalendarOpen(false);
  };

  const canGoToPreviousMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoToNextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-secondary/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Data inicial do monitoramento</p>
            <p className="text-sm font-semibold text-foreground">{formatDisplay(selectedDate)}</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => setIsCalendarOpen(true)}
          >
            <Calendar className="h-4 w-4" />
            Selecionar
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">Permite de hoje até +{DOCUMENTS_MAX_FUTURE_DAYS} dias.</p>
      </div>

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
              disabled={!canGoToPreviousMonth}
              className={`${DS_RADIUS.section} p-2 text-card-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-card-foreground">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h3>

            <button
              type="button"
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth}
              className={`${DS_RADIUS.section} p-2 text-card-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 p-3 pb-0">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
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
              const isToday = isSameDay(date, today);
              const isDisabled = !isSelectableDate(date);

              return (
                <button
                  type="button"
                  key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square ${DS_RADIUS.section} flex flex-col items-center justify-center
                    text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-primary text-primary-foreground scale-105'
                      : isToday
                        ? 'bg-secondary text-primary ring-2 ring-primary'
                        : 'text-card-foreground hover:bg-secondary'
                    }
                    ${isDisabled ? 'cursor-not-allowed text-muted-foreground/40 hover:bg-transparent' : ''}
                  `}
                >
                  <span className="text-base">{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-4 pt-2">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className={`w-full ${DS_RADIUS.section} bg-secondary py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90`}
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

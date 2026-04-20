import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DS_RADIUS } from './design-system';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabledDates?: (date: Date) => boolean;
  autoFocus?: boolean;
  locale?: string;
  renderDay?: (date: Date, isSelected: boolean, isToday: boolean, selectable: boolean) => React.ReactNode;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const endOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  className,
  disabledDates,
  autoFocus = false,
  renderDay,
}) => {
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));
  const [focusedDate, setFocusedDate] = useState(() => new Date(selectedDate));

  useEffect(() => {
    setViewDate(new Date(selectedDate));
    setFocusedDate(new Date(selectedDate));
  }, [selectedDate]);

  const minBoundary = useMemo(() => (minDate ? startOfDay(minDate) : undefined), [minDate]);
  const maxBoundary = useMemo(() => (maxDate ? endOfDay(maxDate) : undefined), [maxDate]);

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isSelectable = (date: Date) => {
    if (minBoundary && date < minBoundary) return false;
    if (maxBoundary && date > maxBoundary) return false;
    if (disabledDates?.(date)) return false;
    return true;
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i, 12, 0, 0, 0));
    }

    return days;
  };

  const goToPreviousMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1, 12, 0, 0, 0));
  };

  const goToNextMonth = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1, 12, 0, 0, 0));
  };

  const goToToday = () => {
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
    setViewDate(normalizedToday);
    setFocusedDate(normalizedToday);
  };

  const handleKeyboardNavigation = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;

    if (key === 'PageUp') {
      event.preventDefault();
      goToPreviousMonth();
      return;
    }

    if (key === 'PageDown') {
      event.preventDefault();
      goToNextMonth();
      return;
    }

    let nextDate: Date | null = null;

    if (key === 'ArrowLeft') nextDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate() - 1, 12, 0, 0, 0);
    if (key === 'ArrowRight') nextDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate() + 1, 12, 0, 0, 0);
    if (key === 'ArrowUp') nextDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate() - 7, 12, 0, 0, 0);
    if (key === 'ArrowDown') nextDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate() + 7, 12, 0, 0, 0);

    if (nextDate) {
      event.preventDefault();
      setFocusedDate(nextDate);
      setViewDate(new Date(nextDate));
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1, 12, 0, 0, 0);
      setFocusedDate(firstDay);
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 12, 0, 0, 0);
      setFocusedDate(lastDay);
      return;
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (isSelectable(focusedDate)) {
        onDateSelect(focusedDate);
      }
    }
  };

  const years = useMemo(() => {
    const fallbackStart = selectedDate.getFullYear() - 100;
    const fallbackEnd = selectedDate.getFullYear() + 20;
    const startYear = minDate?.getFullYear() ?? fallbackStart;
    const endYear = maxDate?.getFullYear() ?? fallbackEnd;
    const totalYears = Math.max(endYear - startYear + 1, 1);

    return Array.from({ length: totalYears }, (_, index) => startYear + index);
  }, [minDate, maxDate, selectedDate]);

  return (
    <div
      className={cn('bg-card text-card-foreground', className)}
      role="group"
      aria-label="Calendário"
      tabIndex={autoFocus ? 0 : -1}
      onKeyDown={handleKeyboardNavigation}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className={cn(DS_RADIUS.section, 'p-2 transition-colors hover:bg-secondary active:scale-95')}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center justify-center gap-2">
          <select
            aria-label="Selecionar mês"
            value={viewDate.getMonth()}
            onChange={(e) => {
              const nextMonth = Number(e.target.value);
              const nextDate = new Date(viewDate.getFullYear(), nextMonth, 1, 12, 0, 0, 0);
              setViewDate(nextDate);
              setFocusedDate(nextDate);
            }}
            className={cn(
              'h-10 border border-border bg-background px-3 text-sm font-bold outline-none transition-colors focus:border-primary',
              DS_RADIUS.section
            )}
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            aria-label="Selecionar ano"
            value={viewDate.getFullYear()}
            onChange={(e) => {
              const nextYear = Number(e.target.value);
              const nextDate = new Date(nextYear, viewDate.getMonth(), 1, 12, 0, 0, 0);
              setViewDate(nextDate);
              setFocusedDate(nextDate);
            }}
            className={cn(
              'h-10 border border-border bg-background px-3 text-sm font-bold outline-none transition-colors focus:border-primary',
              DS_RADIUS.section
            )}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className={cn(DS_RADIUS.section, 'p-2 transition-colors hover:bg-secondary active:scale-95')}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">
          Use as setas para navegar e Enter para selecionar.
        </p>
        <button
          type="button"
          onClick={goToToday}
          className={cn(
            'px-3 py-1.5 text-xs font-bold transition-colors hover:bg-secondary',
            DS_RADIUS.section
          )}
        >
          Hoje
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 p-3 pb-0">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-bold uppercase tracking-tight text-muted-foreground">
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
          const isCurrDay = isToday(date);
          const selectable = isSelectable(date);
          const isFocused = isSameDay(date, focusedDate);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <button
              type="button"
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              disabled={!selectable}
              onClick={(e) => {
                e.stopPropagation();
                setFocusedDate(date);
                onDateSelect(date);
              }}
              onFocus={() => setFocusedDate(date)}
              aria-label={date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              aria-pressed={isSelected}
              className={cn(
                'aspect-square flex flex-col items-center justify-center text-sm font-bold transition-all transform active:scale-90',
                DS_RADIUS.section,
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : isCurrDay
                    ? 'bg-secondary text-primary ring-2 ring-primary/50'
                    : 'hover:bg-secondary/80 text-foreground',
                isWeekend && !isSelected && 'text-muted-foreground',
                isFocused && 'ring-2 ring-primary/35 ring-offset-2 ring-offset-background',
                !selectable && 'cursor-not-allowed grayscale opacity-20'
              )}
            >
              {renderDay ? renderDay(date, isSelected, isCurrDay, selectable) : date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

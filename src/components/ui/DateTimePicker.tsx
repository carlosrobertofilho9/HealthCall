import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, Clock, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import { Calendar } from './Calendar';
import { DS_RADIUS, DS_COLOR } from './design-system';

interface DateTimePickerProps {
  value?: string; // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowClear?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  minuteStep?: number;
  disabledDates?: (date: Date) => boolean;
}

const parseLocalDateTime = (value?: string) => {
  if (!value) return undefined;

  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day, hour ?? 0, minute ?? 0, 0, 0);
};

const formatLocalDateTime = (date: Date, hour: number, minute: number) => {
  const finalDate = new Date(date);
  finalDate.setHours(hour, minute, 0, 0);

  const year = finalDate.getFullYear();
  const month = String(finalDate.getMonth() + 1).padStart(2, '0');
  const day = String(finalDate.getDate()).padStart(2, '0');
  const hours = String(hour).padStart(2, '0');
  const minutes = String(minute).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const clampMinuteToStep = (minute: number, minuteStep: number) => {
  if (minuteStep <= 1) return minute;
  const rounded = Math.round(minute / minuteStep) * minuteStep;
  return rounded >= 60 ? 60 - minuteStep : rounded;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Selecione data e hora',
  icon,
  className,
  label,
  disabled,
  readOnly,
  minDate,
  maxDate,
  allowClear = true,
  required,
  error,
  helperText,
  minuteStep = 5,
  disabledDates,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);

  const safeMinuteStep = Math.min(Math.max(minuteStep, 1), 30);
  const parsedValue = useMemo(() => parseLocalDateTime(value), [value]);
  const initialDate = parsedValue ?? new Date();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [hour, setHour] = useState(initialDate.getHours());
  const [minute, setMinute] = useState(clampMinuteToStep(initialDate.getMinutes(), safeMinuteStep));

  useEffect(() => {
    const nextDate = parsedValue ?? new Date();
    setSelectedDate(nextDate);
    setHour(nextDate.getHours());
    setMinute(clampMinuteToStep(nextDate.getMinutes(), safeMinuteStep));
  }, [parsedValue, safeMinuteStep]);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      buttonRef.current?.focus();
    } else if (isOpen) {
      const frame = window.requestAnimationFrame(() => {
        calendarRef.current?.focus();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    return undefined;
  }, [isOpen]);

  useEffect(() => {
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    onChange(formatLocalDateTime(selectedDate, hour, minute));
    setIsOpen(false);
  };

  const applyNow = () => {
    const now = new Date();
    const normalizedMinute = clampMinuteToStep(now.getMinutes(), safeMinuteStep);
    setSelectedDate(now);
    setHour(now.getHours());
    setMinute(normalizedMinute);
  };

  const applyOffsetMinutes = (offset: number) => {
    const base = new Date();
    base.setMinutes(base.getMinutes() + offset);
    const normalizedMinute = clampMinuteToStep(base.getMinutes(), safeMinuteStep);
    setSelectedDate(base);
    setHour(base.getHours());
    setMinute(normalizedMinute);
  };

  const displayValue = parsedValue
    ? parsedValue.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const canClear = Boolean(value) && allowClear && !disabled && !readOnly;
  const minuteOptions = Array.from({ length: Math.ceil(60 / safeMinuteStep) }, (_, index) => index * safeMinuteStep).filter((value) => value < 60);

  return (
    <>
      <div className={cn('relative w-full', className)}>
        {label && (
          <label className="mb-1.5 ml-1 block text-xs font-semibold text-muted-foreground">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          onClick={() => {
            if (readOnly) return;
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (readOnly) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          className={cn(
            'flex h-11 w-full items-center border transition-all focus:outline-none focus:ring-2',
            DS_COLOR.field.default,
            DS_COLOR.focus.field,
            DS_RADIUS.pill,
            icon ? 'pl-12 pr-4' : 'px-4',
            canClear ? 'pr-12' : '',
            disabled && 'cursor-not-allowed bg-muted opacity-50',
            readOnly && 'cursor-default',
            error && 'border-destructive focus:ring-destructive/20'
          )}
        >
          {icon && (
            <span className="pointer-events-none absolute left-4 text-muted-foreground">
              {icon}
            </span>
          )}
          <span className={cn('truncate font-medium', !displayValue && 'text-muted-foreground')}>
            {displayValue || placeholder}
          </span>
          {canClear ? (
            <span className="absolute right-10 flex items-center justify-center">
              <button
                type="button"
                tabIndex={-1}
                aria-label="Limpar data e hora"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear?.();
                  onChange('');
                }}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          ) : null}
          <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground/60" />
        </button>
        {(error || helperText) && (
          <p className={cn('mt-1 text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || helperText}
          </p>
        )}
      </div>

      {isOpen && (
        <Modal
          isOpen
          onClose={() => setIsOpen(false)}
          position="bottom"
          panelClassName="w-full sm:w-[450px] safe-area-bottom overflow-hidden animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center justify-between border-b border-border bg-card p-4">
            <div>
              <h3 className="text-lg font-bold">Data e Hora</h3>
              <p className="text-xs text-muted-foreground">Ajuste o registro clínico</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-secondary"
              aria-label="Fechar seletor de data e hora"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-border bg-secondary/5 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyNow}
                className={cn(
                  'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                  DS_COLOR.action.secondary,
                  DS_RADIUS.section
                )}
              >
                Agora
              </button>
              <button
                type="button"
                onClick={() => applyOffsetMinutes(5)}
                className={cn(
                  'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                  DS_COLOR.action.secondary,
                  DS_RADIUS.section
                )}
              >
                +5 min
              </button>
              <button
                type="button"
                onClick={() => applyOffsetMinutes(10)}
                className={cn(
                  'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                  DS_COLOR.action.secondary,
                  DS_RADIUS.section
                )}
              >
                +10 min
              </button>
              {canClear && (
                <button
                  type="button"
                  onClick={() => {
                    onClear?.();
                    onChange('');
                    setIsOpen(false);
                  }}
                  className={cn(
                    'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                    DS_COLOR.action.secondary,
                    DS_RADIUS.section
                  )}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto" ref={calendarRef} tabIndex={-1} onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsOpen(false);
            }
          }}>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleSelectDate}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              autoFocus
            />

            <div className="border-t border-border bg-secondary/5 p-4">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Horário do Registro
              </h4>

              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Hora</span>
                  <select
                    aria-label="Selecionar hora"
                    value={hour}
                    onChange={(e) => setHour(parseInt(e.target.value, 10))}
                    className={cn(
                      'h-14 w-20 border-2 border-border bg-background text-center text-2xl font-black outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20',
                      DS_RADIUS.section
                    )}
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <span className="mt-6 text-3xl font-black text-muted-foreground">:</span>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Minuto</span>
                  <select
                    aria-label="Selecionar minuto"
                    value={minute}
                    onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                    className={cn(
                      'h-14 w-20 border-2 border-border bg-background text-center text-2xl font-black outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20',
                      DS_RADIUS.section
                    )}
                  >
                    {minuteOptions.map((option) => (
                      <option key={option} value={option}>{String(option).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border bg-card p-4">
            <button
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex-1 py-4 font-bold transition-all active:scale-95',
                DS_COLOR.action.secondary,
                DS_RADIUS.section
              )}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                'flex-[2] items-center justify-center gap-2 py-4 font-bold transition-all active:scale-95 flex',
                DS_COLOR.action.primary,
                DS_RADIUS.section
              )}
            >
              <Check className="h-5 w-5" />
              Confirmar Registro
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

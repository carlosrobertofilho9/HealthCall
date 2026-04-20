import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import { Calendar } from './Calendar';
import { DS_RADIUS, DS_COLOR } from './design-system';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
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
  closeOnSelect?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabledDates?: (date: Date) => boolean;
  children?: (props: { open: () => void; value: string; displayValue: string }) => React.ReactNode;
  renderDay?: (date: Date, isSelected: boolean, isToday: boolean, selectable: boolean) => React.ReactNode;
}

const parseLocalDate = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Selecione uma data',
  icon,
  className,
  label,
  disabled,
  readOnly,
  minDate,
  maxDate,
  allowClear = true,
  closeOnSelect = true,
  required,
  error,
  helperText,
  disabledDates,
  children,
  renderDay,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  const parsedValue = useMemo(() => parseLocalDate(value), [value]);
  const dateValue = parsedValue ?? new Date();

  useEffect(() => {
    if (!isOpen) {
      buttonRef.current?.focus();
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      calendarRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleSelect = (date: Date) => {
    onChange(formatLocalDate(date));
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const displayValue = parsedValue
    ? parsedValue.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const canClear = Boolean(value) && allowClear && !disabled && !readOnly;

  if (children) {
    return (
      <>
        {children({ open: () => setIsOpen(true), value: value || '', displayValue })}

        {isOpen && (
          <Modal
            isOpen
            onClose={() => setIsOpen(false)}
            position="bottom"
            panelClassName="w-full sm:w-[420px] safe-area-bottom overflow-hidden animate-in slide-in-from-bottom duration-300"
          >
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <div>
                <h3 className="text-lg font-bold">Selecionar Data</h3>
                <p className="text-xs text-muted-foreground">Escolha uma data com segurança.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-secondary"
                aria-label="Fechar seletor de data"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-border bg-secondary/5 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect(new Date())}
                  className={cn(
                    'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                    DS_COLOR.action.secondary,
                    DS_RADIUS.section
                  )}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    handleSelect(yesterday);
                  }}
                  className={cn(
                    'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                    DS_COLOR.action.secondary,
                    DS_RADIUS.section
                  )}
                >
                  Ontem
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

            <div ref={calendarRef} tabIndex={-1} onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
              }
            }}>
              <Calendar
                selectedDate={dateValue}
                onDateSelect={handleSelect}
                minDate={minDate}
                maxDate={maxDate}
                disabledDates={disabledDates}
                renderDay={renderDay}
                autoFocus
              />
            </div>

            <div className="border-t border-border bg-secondary/5 p-4">
              <button
                onClick={() => setIsOpen(false)}
                className={cn(
                  'w-full py-3 font-bold transition-all active:scale-95',
                  DS_COLOR.action.secondary,
                  DS_RADIUS.section
                )}
              >
                Cancelar
              </button>
            </div>
          </Modal>
        )}
      </>
    );
  }

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
                aria-label="Limpar data"
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
          panelClassName="w-full sm:w-[420px] safe-area-bottom overflow-hidden animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center justify-between border-b border-border bg-card p-4">
            <div>
              <h3 className="text-lg font-bold">Selecionar Data</h3>
              <p className="text-xs text-muted-foreground">Escolha uma data com segurança.</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-secondary"
              aria-label="Fechar seletor de data"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-border bg-secondary/5 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className={cn(
                  'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                  DS_COLOR.action.secondary,
                  DS_RADIUS.section
                )}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  handleSelect(yesterday);
                }}
                className={cn(
                  'px-3 py-2 text-xs font-bold transition-all active:scale-95',
                  DS_COLOR.action.secondary,
                  DS_RADIUS.section
                )}
              >
                Ontem
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

          <div ref={calendarRef} tabIndex={-1} onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsOpen(false);
            }
          }}>
            <Calendar
              selectedDate={dateValue}
              onDateSelect={handleSelect}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              renderDay={renderDay}
              autoFocus
            />
          </div>

          <div className="border-t border-border bg-secondary/5 p-4">
            <button
              onClick={() => setIsOpen(false)}
              className={cn(
                'w-full py-3 font-bold transition-all active:scale-95',
                DS_COLOR.action.secondary,
                DS_RADIUS.section
              )}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

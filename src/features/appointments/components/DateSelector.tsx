import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { DS_RADIUS, Modal } from '@/components/ui';
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
  const [direction, setDirection] = useState(0);

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

  const handlePrevDay = () => {
    setDirection(-1);
    onPreviousDay();
  };

  const handleNextDay = () => {
    setDirection(1);
    onNextDay();
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
    <div className={`${DS_RADIUS.surface} border border-border bg-card p-4 print:border-gray-300 print:bg-white overflow-hidden lg:p-0 lg:border-0 lg:bg-transparent lg:shadow-none lg:rounded-none`}>
      <div className="flex flex-col gap-3">
        <div className={`${DS_RADIUS.section} bg-card p-3 lg:bg-transparent lg:p-0`}>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={handlePrevDay}
              className={`w-auto shrink-0 ${DS_RADIUS.section} bg-transparent p-2 text-card-foreground transition-colors hover:bg-secondary/40 print:hidden lg:rounded-md`}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className={`${DS_RADIUS.section} relative bg-transparent px-2 py-2 text-center transition-colors hover:bg-secondary/30 print:bg-transparent overflow-hidden lg:rounded-md lg:py-1`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ x: direction * 50, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ x: -direction * 50, opacity: 0, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary lg:text-xs">
                    {formatWeekday(selectedDate)}
                  </p>
                  <h2 className="text-2xl font-bold text-card-foreground lg:text-3xl print:text-black">
                    {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
                  </h2>
                  <p className={`text-[11px] font-medium lg:text-xs ${dayConfig.hasService ? 'text-muted-foreground' : 'text-red-400'} print:text-gray-500`}>
                    {serviceSummary}
                  </p>
                </motion.div>
              </AnimatePresence>
            </button>

            <motion.button
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={handleNextDay}
              className={`w-auto shrink-0 ${DS_RADIUS.section} bg-transparent p-2 text-card-foreground transition-colors hover:bg-secondary/40 print:hidden lg:rounded-md`}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>

          <div className="mt-2 flex items-center justify-center">
            <motion.span 
              layout
              className={`${DS_RADIUS.pill} border px-2.5 py-0.5 text-[10px] font-semibold ${isToday() ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-secondary/60 text-muted-foreground'} lg:text-xs lg:px-3 lg:py-1`}
            >
              {isToday() ? 'Hoje' : 'Dia selecionado'}
            </motion.span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 print:hidden">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className={`inline-flex h-9 items-center justify-center gap-1.5 ${DS_RADIUS.section} border border-border bg-secondary px-3 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 shadow-sm lg:rounded-md lg:h-8`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendário</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onToday}
            disabled={isToday()}
            className={`h-9 ${DS_RADIUS.section} bg-primary px-3 text-xs font-bold text-primary-foreground transition-all shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:scale-100 lg:rounded-md lg:h-8`}
          >
            Ir para Hoje
          </motion.button>
        </div>
      </div>

      {/* Modal do Calendário */}
      <AnimatePresence>
        {isCalendarOpen && (
          <Modal
            isOpen
            onClose={() => setIsCalendarOpen(false)}
            position="bottom"
            overlayClassName="p-0 sm:p-4 backdrop-blur-sm"
            panelClassName="w-full overflow-hidden sm:w-auto sm:min-w-85 sm:max-w-100"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-card w-full"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className={`${DS_RADIUS.section} p-2 text-card-foreground transition-colors hover:bg-secondary`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <h3 className="text-lg font-bold text-card-foreground">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h3>
                
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className={`${DS_RADIUS.section} p-2 text-card-foreground transition-colors hover:bg-secondary`}
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
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      className={`
                        aspect-square ${DS_RADIUS.section} flex flex-col items-center justify-center
                        text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md' 
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
                        <span className={`w-1.5 h-1.5 ${DS_RADIUS.pill} bg-primary mt-0.5`} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="p-4 pt-2 border-t border-border">
                <div className="mb-4 flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 ${DS_RADIUS.pill} bg-primary`} />
                    <span className="text-muted-foreground">Com atendimento</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 ${DS_RADIUS.pill} bg-muted-foreground/50`} />
                    <span className="text-muted-foreground">Sem atendimento</span>
                  </div>
                </div>
                
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
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateSelector;


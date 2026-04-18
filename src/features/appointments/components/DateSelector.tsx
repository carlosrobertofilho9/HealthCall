import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { formatDateForDisplay, getDayConfig } from '../services/appointmentService';
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
  const calendarRef = useRef<HTMLDivElement>(null);

  // Fechar calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).replace('.', '');
  };

  const formatWeekday = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  return (
    <div className="bg-[#1a3a26] rounded-2xl p-4 sm:p-6 print:bg-white print:border print:border-gray-300">
      {/* Layout Mobile First */}
      <div className="flex flex-col gap-4">
        {/* Linha principal: navegação e data */}
        <div className="flex items-center justify-between gap-2">
          {/* Botão anterior */}
          <button
            onClick={onPreviousDay}
            className="p-3 rounded-xl bg-[#264532] hover:bg-[#305a3e] active:scale-95 transition-all print:hidden touch-manipulation"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Data central - clicável para abrir calendário */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex-1 text-center py-2 px-3 rounded-xl bg-[#264532]/50 hover:bg-[#264532] transition-colors print:bg-transparent print:hover:bg-transparent"
          >
            <p className="text-primary text-xs sm:text-sm font-medium capitalize print:text-gray-600">
              {formatWeekday(selectedDate)}
            </p>
            <h2 className="text-lg sm:text-2xl font-bold text-white print:text-black">
              {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
            </h2>
            <p className={`text-xs sm:text-sm ${dayConfig.hasService ? 'text-[#96c5a9]' : 'text-red-400'} print:text-gray-500`}>
              {dayConfig.hasService 
                ? dayConfig.serviceType === 'HOME_VISIT'
                  ? `${dayConfig.totalSlots} visitas domiciliares`
                  : `${dayConfig.totalSlots} vagas`
                : 'Sem atendimento'
              }
            </p>
          </button>

          {/* Botão próximo */}
          <button
            onClick={onNextDay}
            className="p-3 rounded-xl bg-[#264532] hover:bg-[#305a3e] active:scale-95 transition-all print:hidden touch-manipulation"
            aria-label="Próximo dia"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Linha de ações: botão calendário e hoje */}
        <div className="flex items-center justify-center gap-3 print:hidden">
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#264532] hover:bg-[#305a3e] active:scale-95 transition-all text-white text-sm font-medium touch-manipulation"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendário</span>
          </button>

          {!isToday() && (
            <button
              onClick={onToday}
              className="px-4 py-2.5 rounded-xl bg-primary text-[#122118] font-semibold hover:bg-opacity-80 active:scale-95 transition-all text-sm touch-manipulation"
            >
              Ir para Hoje
            </button>
          )}
        </div>
      </div>

      {/* Modal do Calendário */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div 
            ref={calendarRef}
            className="bg-[#1a3a26] w-full sm:w-auto sm:min-w-[340px] sm:max-w-[400px] rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up sm:animate-none"
          >
            {/* Header do calendário */}
            <div className="flex items-center justify-between p-4 border-b border-[#264532]">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-xl hover:bg-[#264532] transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              
              <h3 className="text-lg font-bold text-white">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-xl hover:bg-[#264532] transition-colors touch-manipulation"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 p-3 pb-0">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-[#96c5a9] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
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
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center
                      text-sm font-medium transition-all touch-manipulation
                      ${isSelected 
                        ? 'bg-primary text-[#122118] scale-105 shadow-lg shadow-primary/30' 
                        : isCurrentDay
                          ? 'bg-[#264532] text-primary ring-2 ring-primary'
                          : hasService
                            ? 'text-white hover:bg-[#264532]'
                            : 'text-[#4a6b56] hover:bg-[#264532]/50'
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

            {/* Legenda e botão fechar */}
            <div className="p-4 pt-2 border-t border-[#264532]">
              <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[#96c5a9]">Com atendimento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4a6b56]" />
                  <span className="text-[#96c5a9]">Sem atendimento</span>
                </div>
              </div>
              
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="w-full py-3 rounded-xl bg-[#264532] hover:bg-[#305a3e] text-white font-semibold transition-colors touch-manipulation"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animação CSS para o modal */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DateSelector;

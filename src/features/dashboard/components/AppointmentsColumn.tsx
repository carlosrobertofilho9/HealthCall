
import React, { useEffect, useState } from 'react';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { Calendar, UserPlus, Copy, Clipboard, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types';

interface AppointmentsColumnProps {
  onCheckIn: (name: string) => void;
  queuedPatients: Patient[];
}

const AppointmentsColumn: React.FC<AppointmentsColumnProps> = ({ onCheckIn, queuedPatients }) => {
  // Use the hook to fetch appointments
  const { 
    appointments, 
    slots,
    dayConfig, 
    isLoading, 
    goToToday,
    goToPreviousDay, 
    goToNextDay,
    selectedDate 
  } = useAppointments();

  // Ensuring we are looking at today when the component mounts
  useEffect(() => {
    // Check if selectedDate is not today (simple check by day/month/year)
    const today = new Date();
    if (
      selectedDate.getDate() !== today.getDate() ||
      selectedDate.getMonth() !== today.getMonth() ||
      selectedDate.getFullYear() !== today.getFullYear()
    ) {
      goToToday();
    }
  }, []);

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success('Nome copiado!');
  };

  const handleCopyDoc = (doc: string) => {
    // Remove non-digits
    const rawDoc = doc.replace(/\D/g, '');
    navigator.clipboard.writeText(rawDoc);
    toast.success('Documento copiado (apenas números)!');
  };

  // Helper to check if patient is already in queue (fuzzy match by name)
  const isPatientInQueue = (patientName: string) => {
    return queuedPatients.some(p => p.name.toLowerCase() === patientName.toLowerCase());
  };

  const formattedDate = new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', 
    month: '2-digit',
    year: '2-digit'
  }).format(selectedDate);
  
  const isToday = new Date().toDateString() === selectedDate.toDateString();


  return (
    <div className="lg:col-span-1 bg-[#1a2c22] rounded-2xl p-6 shadow-2xl border border-white/5 flex flex-col h-auto lg:h-full lg:max-h-[calc(100vh-2rem)]">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-white/5">
        <div className="space-y-2">
            <h2 className="text-white text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-[#264532] rounded-lg border border-white/5 shadow-inner">
                 <Calendar className="text-[#96c5a9]" size={20} />
              </div>
              Agendamentos
            </h2>
            <p className="text-[#96c5a9]/80 text-sm pl-1">
              Pacientes agendados para hoje ({dayConfig.hasService ? dayConfig.dayName : 'Sem atendimento'}).
            </p>
        </div>

        {/* Date Navigation Toolbar */}
        <div className="flex items-center justify-between bg-[#264532]/50 border border-white/5 rounded-xl p-1.5 h-14 w-full">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-[#96c5a9] hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all" 
                onClick={goToPreviousDay}
            >
                <ChevronLeft size={20} />
            </Button>
            
            <div 
                className="flex flex-col items-center justify-center cursor-pointer group flex-1 py-1" 
                onClick={goToToday}
                title="Voltar para Hoje"
            >
                <span className={cn(
                    "text-base font-bold tracking-wide transition-colors",
                    isToday ? "text-white" : "text-yellow-500 group-hover:text-yellow-400"
                )}>
                    {formattedDate}
                </span>
                {!isToday && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-yellow-500/70 group-hover:text-yellow-400 transition-colors whitespace-nowrap mt-0.5">
                        Voltar para hoje
                    </span>
                )}
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-[#96c5a9] hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition-all" 
                onClick={goToNextDay}
            >
                <ChevronRight size={20} />
            </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 lg:overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
             {/* Empty State */}
             {slots.filter(s => s.appointment).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Calendar className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-center">Nenhum agendamento para <br/> {dayConfig.dayName}.</p>
                    {!dayConfig.hasService && <p className="text-xs opacity-50 mt-1">(Dia sem expediente)</p>}
                </div>
             )}

             {/* Morning Slots */}
             {slots.filter(s => s.period === 'Manhã' && s.appointment).length > 0 && (
                 <div>
                    <h3 className="text-[#96c5a9] font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2 pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        Manhã
                    </h3>
                    <div className="space-y-3">
                        {slots.filter(s => s.period === 'Manhã' && s.appointment).map(slot => {
                            const apt = slot.appointment!;
                            const inQueue = isPatientInQueue(apt.patient_name);
                            return (
                                <AppointmentCard 
                                    key={apt.id} 
                                    apt={apt} 
                                    inQueue={inQueue} 
                                    onCheckIn={onCheckIn} 
                                    handleCopyName={handleCopyName} 
                                    handleCopyDoc={handleCopyDoc} 
                                />
                            );
                        })}
                    </div>
                 </div>
             )}

             {/* Afternoon Slots */}
             {slots.filter(s => s.period === 'Tarde' && s.appointment).length > 0 && (
                 <div>
                    <h3 className="text-[#96c5a9] font-medium text-xs uppercase tracking-wider mb-2 mt-2 flex items-center gap-2 pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Tarde
                    </h3>
                    <div className="space-y-3">
                        {slots.filter(s => s.period === 'Tarde' && s.appointment).map(slot => {
                            const apt = slot.appointment!;
                            const inQueue = isPatientInQueue(apt.patient_name);
                            return (
                                <AppointmentCard 
                                    key={apt.id} 
                                    apt={apt} 
                                    inQueue={inQueue} 
                                    onCheckIn={onCheckIn} 
                                    handleCopyName={handleCopyName} 
                                    handleCopyDoc={handleCopyDoc} 
                                />
                            );
                        })}
                    </div>
                 </div>
             )}
          </>
        )}
      </div>
      
      {/* Footer / Stats */}
      <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>Turno: {dayConfig.dayName}</span>
          </div>
          <div>
            Total: {slots.filter(s => s.appointment).length}
          </div>
      </div>
    </div>
  );
};

// Extracted Component for cleaner render
const AppointmentCard = ({ apt, inQueue, onCheckIn, handleCopyName, handleCopyDoc }: any) => (
    <div 
    className={cn(
        "p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden",
        inQueue 
        ? "bg-[#264532]/20 border-green-500/10 opacity-60 hover:opacity-100" 
        : "bg-[#1a2c22]/40 border-white/5 hover:bg-[#1a2c22] hover:border-white/10 hover:shadow-lg"
    )}
    >
    <div className="flex flex-col gap-3 relative z-10">
        
        {/* Info Row */}
        <div className="flex justify-between items-start">
        <div className="min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-[#96c5a9] bg-[#264532] px-2 py-0.5 rounded border border-white/5">
                {String(apt.slot_number).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
                <h3 
                    className="font-semibold text-white truncate text-sm leading-tight cursor-pointer hover:text-green-400 transition-colors" 
                    title="Clique para copiar o nome"
                    onClick={() => handleCopyName(apt.patient_name)}
                >
                    {apt.patient_name}
                </h3>
                <p 
                    className="text-xs text-[#96c5a9]/70 truncate font-mono mt-0.5 cursor-pointer hover:text-green-400 transition-colors"
                    title="Clique para copiar o documento"
                    onClick={() => handleCopyDoc(apt.document_value)}
                >
                    {apt.document_value}
                </p>
            </div>
            </div>
        </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2">
        
        {/* Check-in Button */}
        <Button
            size="sm"
            variant="ghost"
            disabled={inQueue}
            onClick={() => onCheckIn(apt.patient_name)}
            className={cn(
            "h-8 flex-1 text-xs gap-2 font-medium transition-all duration-200 rounded-lg",
            inQueue 
                ? "bg-transparent text-gray-500 border border-transparent cursor-not-allowed justify-start px-0" 
                : "bg-[#264532] text-[#96c5a9] border border-white/5 hover:bg-green-500 hover:text-white hover:border-green-400 hover:shadow-green-500/20 shadow-sm"
            )}
        >
            {inQueue ? (
                <>
                <CheckCircle2 size={14} />
                <span className="opacity-70">Já na fila</span>
                </>
            ) : (
                <>
                <UserPlus size={14} />
                Check-in
                </>
            )}
        </Button>
        </div>
    </div>
    </div>
);

export default AppointmentsColumn;

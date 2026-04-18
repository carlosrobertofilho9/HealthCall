import React, { useEffect } from 'react';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import {
  Calendar,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Appointment, Patient } from '@/types';
import {
  isBlockedAppointment,
  isActiveAppointment
} from '@/features/appointments/services/appointmentService';

interface AppointmentsColumnProps {
  onCheckIn: (appointment: Appointment) => Promise<boolean>;
  queuedPatients: Patient[];
}

const AppointmentsColumn: React.FC<AppointmentsColumnProps> = ({ onCheckIn, queuedPatients }) => {
  // Use the hook to fetch appointments
  const { 
    slots,
    dayConfig, 
    isLoading, 
    goToToday,
    goToPreviousDay, 
    goToNextDay,
    selectedDate,
    refresh,
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
  const isHomeVisitDay = dayConfig.serviceType === 'HOME_VISIT';
  const visibleSlots = slots.filter(
    slot => slot.appointment && !isBlockedAppointment(slot.appointment) && isActiveAppointment(slot.appointment)
  );

  const handleCheckIn = async (appointment: Appointment) => {
    try {
      const success = await onCheckIn(appointment);
      if (success) {
        await refresh();
      }
    } catch (error) {
      console.error('Erro ao fazer check-in da marcação:', error);
      toast.error('Paciente entrou na fila, mas o status da marcação não foi atualizado.');
    }
  };


  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col h-auto xl:h-full xl:max-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-border">
        <div className="space-y-2">
            <h2 className="text-card-foreground text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg border border-border shadow-inner">
                 <Calendar className="text-muted-foreground" size={20} />
              </div>
              {isHomeVisitDay ? 'Visitas domiciliares' : 'Agendamentos'}
            </h2>
            <p className="text-muted-foreground text-sm pl-1">
              {isHomeVisitDay
                ? `Visitas domiciliares de hoje (${dayConfig.dayName}).`
                : `Pacientes agendados para hoje (${dayConfig.hasService ? dayConfig.dayName : 'Sem atendimento'}).`}
            </p>
        </div>

        {/* Date Navigation Toolbar */}
        <div className="flex items-center justify-between bg-secondary/40 border border-border rounded-xl p-1.5 h-14 w-full">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-muted-foreground hover:text-foreground rounded-lg active:scale-95 transition-all" 
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
              className="h-10 w-10 text-muted-foreground hover:text-foreground rounded-lg active:scale-95 transition-all" 
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
             {visibleSlots.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Calendar className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-center">
                        {isHomeVisitDay ? 'Nenhuma visita domiciliar para' : 'Nenhum agendamento para'} <br/> {dayConfig.dayName}.
                    </p>
                    {!dayConfig.hasService && <p className="text-xs opacity-50 mt-1">(Dia sem expediente)</p>}
                    {isHomeVisitDay && <p className="text-xs opacity-50 mt-1">(Sem visitas domiciliares marcadas)</p>}
                </div>
             )}

             {/* Morning Slots */}
             {visibleSlots.filter(s => s.period === 'Manhã').length > 0 && (
                 <div>
                    <h3 className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2 pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        {isHomeVisitDay ? 'Visitas da manhã' : 'Manhã'}
                    </h3>
                    <div className="space-y-3">
                        {visibleSlots.filter(s => s.period === 'Manhã').map(slot => {
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
                                    isHomeVisitDay={isHomeVisitDay}
                                />
                            );
                        })}
                    </div>
                 </div>
             )}

             {/* Afternoon Slots */}
             {visibleSlots.filter(s => s.period === 'Tarde').length > 0 && (
                 <div>
                    <h3 className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-2 mt-2 flex items-center gap-2 pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Tarde
                    </h3>
                    <div className="space-y-3">
                        {visibleSlots.filter(s => s.period === 'Tarde').map(slot => {
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
                                    isHomeVisitDay={isHomeVisitDay}
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
      <div className="pt-4 mt-2 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{isHomeVisitDay ? 'Dia' : 'Turno'}: {dayConfig.dayName}</span>
          </div>
          <div>
            Total: {visibleSlots.length}
          </div>
      </div>
    </div>
  );
};

// Extracted Component for cleaner render
const AppointmentCard = ({ apt, inQueue, onCheckIn, handleCopyName, handleCopyDoc, isHomeVisitDay }: any) => (
    <div 
    className={cn(
        "p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden",
        inQueue 
      ? "bg-secondary/20 border-green-500/20 opacity-60 hover:opacity-100" 
      : "bg-card/80 border-border hover:bg-card hover:border-border/90 hover:shadow-lg"
    )}
    >
    <div className="flex flex-col gap-3 relative z-10">
        
        {/* Info Row */}
        <div className="flex justify-between items-start">
        <div className="min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                {String(apt.slot_number).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
                <h3 
                className="font-semibold text-card-foreground truncate text-sm leading-tight cursor-pointer hover:text-primary transition-colors" 
                    title="Clique para copiar o nome"
                    onClick={() => handleCopyName(apt.patient_name)}
                >
                    {apt.patient_name}
                </h3>
                <p 
                className="text-xs text-muted-foreground truncate font-mono mt-0.5 cursor-pointer hover:text-primary transition-colors"
                    title="Clique para copiar o documento"
                    onClick={() => handleCopyDoc(apt.document_value)}
                >
                    {apt.document_value}
                </p>
                {isHomeVisitDay && apt.home_visit_address && (
                    <p
                      className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground truncate cursor-pointer hover:text-primary transition-colors"
                        title="Clique para copiar o endereço"
                        onClick={() => {
                            navigator.clipboard.writeText(apt.home_visit_address);
                            toast.success('Endereço copiado!');
                        }}
                    >
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{apt.home_visit_address}</span>
                    </p>
                )}
            </div>
            </div>
        </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2">
        
        {/* Check-in Button */}
        {isHomeVisitDay ? (
        <div className="h-8 flex-1 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-medium text-muted-foreground flex items-center gap-2">
            <MapPin size={14} />
            Visita domiciliar
        </div>
        ) : (
        <Button
            size="sm"
            variant="ghost"
            disabled={inQueue}
            onClick={() => onCheckIn(apt)}
            className={cn(
            "h-8 flex-1 text-xs gap-2 font-medium transition-all duration-200 rounded-lg",
            inQueue 
                ? "bg-transparent text-gray-500 border border-transparent cursor-not-allowed justify-start px-0" 
              : "bg-secondary text-muted-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-primary/20 shadow-sm"
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
        )}
        </div>
    </div>
    </div>
);

export default AppointmentsColumn;

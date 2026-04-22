import React, { useEffect } from 'react';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import {
  Calendar,
  CalendarCheck2,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Button, Tooltip } from '@/components/ui';
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
      await onCheckIn(appointment);
    } catch (error) {
      console.error('Erro ao fazer check-in da marcação:', error);
      toast.error('Não foi possível adicionar o paciente à fila.');
    }
  };


  return (
    <section className="flex h-auto flex-col rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(0,27,61,0.08)] xl:h-full xl:min-h-0">
      <div className="border-b border-[#E5ECF3] p-5 lg:p-6">
        <div className="mb-5 flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F7F2] text-[#00A885]">
               <CalendarCheck2 className="size-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold tracking-normal text-[#001B3D]">
                {isHomeVisitDay ? 'Visitas domiciliares' : 'Agendamentos'}
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[#64748B]">
              {isHomeVisitDay
                ? `Visitas domiciliares de hoje (${dayConfig.dayName}).`
                : `Pacientes agendados para hoje (${dayConfig.hasService ? dayConfig.dayName : 'Sem atendimento'}).`}
              </p>
            </div>
        </div>

        <div className="flex h-14 w-full items-center justify-between rounded-2xl border border-[#DCE5EE] bg-[#F8FAFC] p-1.5">
            <Tooltip content="Dia anterior">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl border-0 bg-transparent text-[#64748B] shadow-none transition-all hover:bg-white hover:text-[#1466F5] active:scale-95"
                onClick={goToPreviousDay}
                aria-label="Dia anterior"
              >
                <ChevronLeft className="size-5" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Voltar para hoje" className="flex flex-1">
              <div
                className="flex flex-col items-center justify-center cursor-pointer group flex-1 py-1" 
                onClick={goToToday}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    goToToday();
                  }
                }}
              >
                <span className={cn(
                    "text-base font-extrabold tracking-normal transition-colors",
                    isToday ? "text-[#001B3D]" : "text-[#B77900] group-hover:text-[#875A00]"
                )}>
                    {formattedDate}
                </span>
                {!isToday && (
                    <span className="mt-0.5 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#B77900] transition-colors group-hover:text-[#875A00]">
                        Voltar para hoje
                    </span>
                )}
              </div>
            </Tooltip>

            <Tooltip content="Próximo dia">
              <Button
                variant="ghost"
                size="icon"
              className="h-10 w-10 rounded-xl border-0 bg-transparent text-[#64748B] shadow-none transition-all hover:bg-white hover:text-[#1466F5] active:scale-95"
                onClick={goToNextDay}
                aria-label="Próximo dia"
              >
                <ChevronRight className="size-5" />
              </Button>
            </Tooltip>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 p-5 lg:overflow-y-auto">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="size-9 animate-spin rounded-full border-2 border-[#DCE5EE] border-t-[#00BB94]" />
          </div>
        ) : (
          <>
             {visibleSlots.length === 0 && (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-10 text-center">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#1466F5]">
                      <Calendar className="size-7" />
                    </div>
                    <p className="text-sm font-bold leading-6 text-[#001B3D]">
                        {isHomeVisitDay ? 'Nenhuma visita domiciliar para' : 'Nenhum agendamento para'} <br/> {dayConfig.dayName}.
                    </p>
                    {!dayConfig.hasService && <p className="mt-2 text-xs font-semibold text-[#64748B]">(Dia sem expediente)</p>}
                    {isHomeVisitDay && <p className="mt-2 text-xs font-semibold text-[#64748B]">(Sem visitas domiciliares marcadas)</p>}
                </div>
             )}

             {visibleSlots.filter(s => s.period === 'Manhã').length > 0 && (
                 <div>
                    <h3 className="mb-3 flex items-center gap-2 pl-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#64748B]">
                        <span className="size-2 rounded-full bg-[#F59E0B]"></span>
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
                                    onCheckIn={handleCheckIn}
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
                    <h3 className="mb-3 mt-2 flex items-center gap-2 pl-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#64748B]">
                        <span className="size-2 rounded-full bg-[#1466F5]"></span>
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
                                    onCheckIn={handleCheckIn}
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
      
      <div className="flex items-center justify-between border-t border-[#E5ECF3] px-5 py-4 text-xs font-bold text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>{isHomeVisitDay ? 'Dia' : 'Turno'}: {dayConfig.dayName}</span>
          </div>
          <div>
            Total: {visibleSlots.length}
          </div>
      </div>
    </section>
  );
};

// Extracted Component for cleaner render
const AppointmentCard = ({ apt, inQueue, onCheckIn, handleCopyName, handleCopyDoc, isHomeVisitDay }: any) => (
    <div 
    className={cn(
        "group relative overflow-hidden rounded-[1.35rem] border p-3.5 transition-all duration-200",
        inQueue 
      ? "border-[#BFECE1] bg-[#E6F7F2] opacity-80 hover:opacity-100"
      : "border-[#DCE5EE] bg-[#F8FAFC] hover:border-[#BFD8FF] hover:bg-white hover:shadow-[0_18px_42px_rgba(0,27,61,0.08)]"
    )}
    >
    <div className="flex flex-col gap-3 relative z-10">
        
        <div className="flex justify-between items-start">
        <div className="min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
            <span className="rounded-xl border border-[#DCE5EE] bg-white px-2.5 py-1 text-xs font-extrabold text-[#001B3D]">
                {String(apt.slot_number).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <Tooltip content="Copiar nome" className="block max-w-full">
                <button
                    type="button"
                    className="block max-w-full truncate text-left text-sm font-extrabold leading-tight text-[#001B3D] transition-colors hover:text-[#1466F5]"
                    onClick={() => handleCopyName(apt.patient_name)}
                >
                    {apt.patient_name}
                </button>
              </Tooltip>
              <Tooltip content="Copiar documento" className="mt-0.5 block max-w-full">
                <button
                    type="button"
                    className="block max-w-full truncate text-left text-xs font-semibold text-[#64748B] transition-colors hover:text-[#1466F5]"
                    onClick={() => handleCopyDoc(apt.document_value)}
                >
                    {apt.document_value}
                </button>
              </Tooltip>
                {isHomeVisitDay && apt.home_visit_address && (
                  <Tooltip content="Copiar endereço" className="mt-1 block max-w-full">
                    <button
                      type="button"
                      className="flex max-w-full items-center gap-1.5 truncate text-left text-xs font-semibold text-[#64748B] transition-colors hover:text-[#1466F5]"
                        onClick={() => {
                            navigator.clipboard.writeText(apt.home_visit_address);
                            toast.success('Endereço copiado!');
                        }}
                    >
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{apt.home_visit_address}</span>
                    </button>
                  </Tooltip>
                )}
            </div>
            </div>
        </div>
        </div>

        <div className="flex items-center gap-2">
        
        {isHomeVisitDay ? (
        <div className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-[#DCE5EE] bg-white px-3 text-xs font-bold text-[#64748B]">
            <MapPin className="size-4" />
            Visita domiciliar
        </div>
        ) : (
        <Button
            size="sm"
            variant="ghost"
            disabled={inQueue}
            onClick={() => onCheckIn(apt)}
            className={cn(
            "h-9 flex-1 gap-2 rounded-xl text-xs font-extrabold transition-all duration-200",
            inQueue 
                ? "cursor-not-allowed justify-start border border-transparent bg-transparent px-0 text-[#007A65]"
              : "border border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65] shadow-none hover:border-[#00BB94] hover:bg-[#00BB94] hover:text-white"
            )}
        >
            {inQueue ? (
                <>
                <CheckCircle2 className="size-4" />
                <span className="opacity-70">Já na fila</span>
                </>
            ) : (
                <>
                <UserPlus className="size-4" />
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

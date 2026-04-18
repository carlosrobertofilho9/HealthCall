import React from 'react';
import { User, FileText, UserCheck, Trash2, Edit, Clock, Ban, MapPin, ClipboardList, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentSlot, Appointment, AppointmentStatus } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import {
  APPOINTMENT_STATUSES,
  getAppointmentStatus,
  isHomeVisitDateString,
} from '../services/appointmentService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface SlotCardProps {
  slot: AppointmentSlot;
  serviceType?: 'UBS' | 'HOME_VISIT';
  onAddClick: (slotNumber: number) => void;
  onEditClick: (appointment: Appointment) => void;
  onDeleteClick: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onRescheduleClick: (appointment: Appointment) => void;
}

/**
 * Card que representa um slot na grade de marcações.
 * Pode estar vazio (disponível) ou preenchido com uma marcação.
 */
export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  serviceType = 'UBS',
  onAddClick,
  onEditClick,
  onDeleteClick,
  onStatusChange,
  onRescheduleClick,
}) => {
  const { slotNumber, period, time, isReserve, appointment } = slot;

  const formatDocument = (type: string, value: string): string => {
    if (type === 'CPF') {
      return `CPF: ${formatCPF(value)}`;
    }
    return `Cartão SUS: ${formatCNS(value)}`;
  };

  const handleCopy = async (text: string, type: 'nome' | 'documento' | 'endereço') => {
    try {
      await navigator.clipboard.writeText(text);
      const label = type === 'nome' ? 'Nome' : type === 'documento' ? 'Documento' : 'Endereço';
      toast.success(`${label} copiado!`);
    } catch (err) {
      console.error('Falha ao copiar:', err);
      toast.error('Erro ao copiar');
    }
  };

  // Slot vazio - disponível para marcação
  if (!appointment) {
    const emptyLabel = serviceType === 'HOME_VISIT' ? 'Visita disponível' : 'Vaga disponível';
    const emptyHint = serviceType === 'HOME_VISIT' ? 'Clique para agendar visita' : 'Clique para agendar';

    return (
      <div
        onClick={() => onAddClick(slotNumber)}
        className="bg-[#1a3a26] rounded-xl p-3 md:p-4 border-2 border-dashed border-[#264532] hover:border-primary hover:bg-[#1e4230] transition-all cursor-pointer group print:bg-white print:border-gray-300 print:hover:bg-white print:cursor-default"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#264532] flex items-center justify-center text-white font-bold text-sm print:bg-gray-100 print:text-gray-600">
              {slotNumber}
            </span>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#96c5a9] print:hidden" />
                <p className="text-[#96c5a9] text-sm font-medium print:text-gray-500">
                  {time || period}
                </p>
              </div>
              <p className="text-white font-medium group-hover:text-primary transition-colors print:text-gray-800">
                {emptyLabel}
              </p>
            </div>
          </div>
          <span className="text-[#96c5a9] text-sm opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
            {emptyHint}
          </span>
        </div>
      </div>
    );
  }

  // Verifica se é um bloqueio
  const isBlocked = appointment.document_value === 'BLOQUEIO';
  const isHomeVisit = isHomeVisitDateString(appointment.scheduled_date);
  const status = getAppointmentStatus(appointment);
  const editableStatuses = APPOINTMENT_STATUSES.filter(
    item => item !== 'Remarcado'
  );
  const statusClass = getStatusClass(status);

  if (isBlocked) {
    return (
      <div className="bg-red-950/20 rounded-xl p-3 md:p-4 border border-red-900/40 w-full overflow-hidden print:bg-white print:border-gray-300">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
             {/* Número do Slot */}
             <span className="w-8 h-8 rounded-full bg-red-900/20 border border-red-900/30 flex items-center justify-center text-red-200 font-bold text-sm shrink-0">
                {slotNumber}
             </span>

             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-red-400/70 print:hidden" />
                  <p className="text-red-400/70 text-sm font-medium">
                    {time || period}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <p className="text-red-200 font-bold truncate">
                    BLOQUEADO: {appointment.patient_name}
                  </p>
                </div>
             </div>
          </div>

          {/* Botão de desbloquear */}
          <button
            onClick={() => onDeleteClick(appointment)}
            className="p-2 rounded-full hover:bg-red-900/30 transition-colors group print:hidden"
            title="Desbloquear horário"
          >
            <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-300" />
          </button>
        </div>
      </div>
    );
  }

  // Slot preenchido com marcação NORMAL
  return (
    <div className="bg-[#1a3a26] rounded-xl p-3 md:p-4 border border-[#264532] print:bg-white print:border-gray-300 w-full overflow-hidden">
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
          <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#122118] font-bold text-sm shrink-0">
            {slotNumber}
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-[#96c5a9] print:hidden shrink-0" />
              <p className="text-[#96c5a9] text-sm font-medium print:text-gray-500 truncate">
                {time || period}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold print:border print:border-gray-300 ${statusClass}`}>
                {status}
              </span>
            </div>
            
            {/* Nome do paciente */}
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <User className="w-4 h-4 text-primary shrink-0" />
              <p 
                className="text-white font-semibold truncate print:text-black cursor-pointer hover:text-primary transition-colors" 
                title="Clique para copiar o nome"
                onClick={() => handleCopy(appointment.patient_name, 'nome')}
              >
                {appointment.patient_name}
              </p>
            </div>

            {/* Documento */}
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <FileText className="w-4 h-4 text-[#96c5a9] shrink-0" />
              <p 
                className="text-[#96c5a9] text-sm truncate print:text-gray-600 cursor-pointer hover:text-white transition-colors"
                title="Clique para copiar o documento (sem pontuação)"
                onClick={() => handleCopy(appointment.document_value.replace(/\D/g, ''), 'documento')}
              >
                {formatDocument(appointment.document_type, appointment.document_value)}
              </p>
            </div>

            {/* ACS */}
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <UserCheck className="w-4 h-4 text-[#96c5a9] shrink-0" />
              <p className="text-[#96c5a9] text-sm truncate print:text-gray-600">
                ACS: {appointment.acs_name}
              </p>
            </div>

            {isHomeVisit && appointment.home_visit_address && (
              <div className="flex items-center gap-2 mt-2 min-w-0">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <p
                  className="text-[#d6f3df] text-sm truncate print:text-gray-700 cursor-pointer hover:text-white transition-colors"
                  title="Clique para copiar o endereço"
                  onClick={() => handleCopy(appointment.home_visit_address || '', 'endereço')}
                >
                  {appointment.home_visit_address}
                </p>
              </div>
            )}

            {isHomeVisit && appointment.home_visit_reference && (
              <div className="flex items-center gap-2 mt-1 min-w-0">
                <MapPin className="w-4 h-4 text-[#96c5a9] shrink-0" />
                <p className="text-[#96c5a9] text-sm truncate print:text-gray-600">
                  Ref.: {appointment.home_visit_reference}
                </p>
              </div>
            )}

            {isHomeVisit && appointment.home_visit_reason && (
              <div className="flex items-start gap-2 mt-1 min-w-0">
                <ClipboardList className="w-4 h-4 text-[#96c5a9] shrink-0 mt-0.5" />
                <p className="text-[#96c5a9] text-sm line-clamp-2 print:text-gray-600">
                  Motivo: {appointment.home_visit_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col items-end gap-2 shrink-0 print:hidden">
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(appointment, value as AppointmentStatus)}
          >
            <SelectTrigger className="h-9 w-36 rounded-xl bg-[#264532] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editableStatuses.map(item => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
          <button
            onClick={() => onRescheduleClick(appointment)}
            className="p-3 md:p-2 rounded-full hover:bg-[#264532] transition-colors"
            title="Remarcar"
          >
            <CalendarClock className="w-5 h-5 md:w-4 md:h-4 text-[#96c5a9] hover:text-white" />
          </button>
          <button
            onClick={() => onEditClick(appointment)}
            className="p-3 md:p-2 rounded-full hover:bg-[#264532] transition-colors"
            title="Editar"
          >
            <Edit className="w-5 h-5 md:w-4 md:h-4 text-[#96c5a9] hover:text-white" />
          </button>
          <button
            onClick={() => onStatusChange(appointment, 'Cancelado')}
            className="p-3 md:p-2 rounded-full hover:bg-red-900/30 transition-colors"
            title="Cancelar"
          >
            <Trash2 className="w-5 h-5 md:w-4 md:h-4 text-[#96c5a9] hover:text-red-400" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getStatusClass(status: AppointmentStatus): string {
  const classes: Record<AppointmentStatus, string> = {
    Agendado: 'bg-blue-500/15 text-blue-200',
    Confirmado: 'bg-primary/15 text-primary',
    Compareceu: 'bg-emerald-500/15 text-emerald-200',
    Faltou: 'bg-amber-500/15 text-amber-200',
    Cancelado: 'bg-red-500/15 text-red-200',
    Remarcado: 'bg-purple-500/15 text-purple-200',
  };

  return classes[status];
}

export default SlotCard;

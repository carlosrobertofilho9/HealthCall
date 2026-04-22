import React, { useState } from 'react';
import {
  User,
  FileText,
  UserCheck,
  Trash2,
  Edit,
  Clock,
  Ban,
  MapPin,
  ClipboardList,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Copy,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentSlot, Appointment, AppointmentStatus } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import {
  APPOINTMENT_STATUSES,
  getAppointmentStatus,
  isHomeVisitDateString
} from '../services/appointmentService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge
} from '@/components/ui';

interface SlotCardProps {
  slot: AppointmentSlot;
  serviceType?: 'UBS' | 'HOME_VISIT';
  onAddClick: (slotNumber: number) => void;
  onEditClick: (appointment: Appointment) => void;
  onDeleteClick: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
  onRescheduleClick: (appointment: Appointment) => void;
  onConfirmationPdfClick: (appointment: Appointment) => void;
}

const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  Agendado:   { bg: 'bg-[#EAF3FF]', text: 'text-[#0F5AD8]', border: 'border-[#D5E6FF]' },
  Compareceu: { bg: 'bg-[#E6F7F2]', text: 'text-[#007A65]', border: 'border-[#CFEDE6]' },
  Faltou:     { bg: 'bg-[#FFF7E6]', text: 'text-[#9A5A00]', border: 'border-[#FFE4B8]' },
  Remarcado:  { bg: 'bg-[#F5EDFF]', text: 'text-[#6D28D9]', border: 'border-[#E9D5FF]' },
};

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  serviceType = 'UBS',
  onAddClick,
  onEditClick,
  onDeleteClick,
  onStatusChange,
  onRescheduleClick,
  onConfirmationPdfClick,
}) => {
  const { slotNumber, period, time, appointment, isAutoBlocked } = slot;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const formatDocument = (type: string, value: string) =>
    type === 'CPF' ? `CPF: ${formatCPF(value)}` : `CNS: ${formatCNS(value)}`;

  /* ── EMPTY SLOT ── */
  if (!appointment) {
    const emptyLabel = serviceType === 'HOME_VISIT' ? 'Visita disponível' : 'Vaga disponível';

    return (
      <div
        onClick={() => onAddClick(slotNumber)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onAddClick(slotNumber)}
        className="group flex cursor-pointer items-center gap-3 rounded-[1rem] border border-dashed border-[#BFD2E5]
          bg-[#F8FAFC] px-4 py-3.5 transition-all duration-150
          hover:border-[#00BB94] hover:bg-[#F4FFFC] active:scale-[0.99]
          print:border-gray-300 print:bg-white"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem]
          border border-[#DCE5EE] bg-white text-xs font-extrabold text-[#64748B] transition-colors
          group-hover:border-[#CFEDE6] group-hover:bg-[#E6F7F2] group-hover:text-[#007A65] print:bg-gray-100 print:text-gray-500">
          {slotNumber}
        </span>

        <div className="flex-1 min-w-0">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0 text-[#64748B] print:hidden" />
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{time || period}</p>
          </div>
          <p className="text-sm font-bold text-[#334155] transition-colors group-hover:text-[#001B3D]">
            {emptyLabel}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#007A65] opacity-0 shadow-[0_8px_18px_rgba(0,27,61,0.05)] transition-opacity group-hover:opacity-100 print:hidden">
          Agendar
        </span>
      </div>
    );
  }

  /* ── BLOCKED SLOT ── */
  const isBlocked = appointment.document_value === 'BLOQUEIO';

  if (isBlocked) {
    const blockedContainerClass = isAutoBlocked
      ? 'border-[#FBCFE8] bg-[#FDF2F8] print:bg-pink-50 print:border-pink-200'
      : 'border-[#FFD6DA] bg-[#FFF4F5] print:bg-white print:border-gray-300';
    const blockedBadgeClass = isAutoBlocked
      ? 'border-[#FBCFE8] bg-white text-[#9D174D] print:bg-pink-100 print:text-pink-800 print:border-pink-200'
      : 'border-[#FFD6DA] bg-white text-[#B42318]';
    const blockedTimeClass = isAutoBlocked
      ? 'text-[#9D174D]/75'
      : 'text-[#B42318]/75';
    const blockedIconClass = isAutoBlocked
      ? 'text-[#DB2777]'
      : 'text-[#D9474F]';
    const blockedTitleClass = isAutoBlocked
      ? 'text-[#831843] print:text-pink-900'
      : 'text-[#9F1239]';

    return (
      <div className={`flex items-center gap-3 rounded-[1rem] border px-4 py-3.5 ${blockedContainerClass}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border text-xs font-extrabold ${blockedBadgeClass}`}>
          {slotNumber}
        </span>

        <div className="flex-1 min-w-0">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Clock className={`w-3 h-3 shrink-0 print:hidden ${isAutoBlocked ? 'text-[#DB2777]/70' : 'text-[#D9474F]/60'}`} />
            <p className={`text-xs font-medium ${blockedTimeClass}`}>{time || period}</p>
          </div>
          <div className="flex items-center gap-2">
            <Ban className={`w-3.5 h-3.5 shrink-0 ${blockedIconClass}`} />
            <p className={`truncate text-sm font-extrabold ${blockedTitleClass}`}>
              {isAutoBlocked ? appointment.patient_name : `BLOQUEADO: ${appointment.patient_name}`}
            </p>
          </div>
        </div>

        {!isAutoBlocked && (
          <button
            onClick={() => onDeleteClick(appointment)}
            className="shrink-0 rounded-[0.85rem] p-2.5 transition-colors hover:bg-white/70 print:hidden"
            title="Desbloquear"
          >
            <Trash2 className="w-4 h-4 text-[#D9474F]" />
          </button>
        )}
      </div>
    );
  }

  /* ── FILLED SLOT ── */
  const isHomeVisit = isHomeVisitDateString(appointment.scheduled_date);
  const status = getAppointmentStatus(appointment);
  const statusStyle = STATUS_STYLES[status];
  const editableStatuses = APPOINTMENT_STATUSES.filter(s => s !== 'Remarcado');

  const hasExtraInfo = isHomeVisit && (
    appointment.home_visit_address ||
    appointment.home_visit_reference ||
    appointment.home_visit_reason
  );

  return (
    <div className="overflow-hidden rounded-[1rem] border border-[#DCE5EE] bg-white
      shadow-[0_8px_24px_rgba(0,27,61,0.035)] transition-all hover:border-[#BFD2E5] hover:shadow-[0_14px_30px_rgba(0,27,61,0.06)]
      print:border-gray-300 print:bg-white">
      
      {/* ── Main row ── */}
      <div className="flex items-start gap-3 px-4 py-3.5">

        {/* Slot badge */}
        <span className="mt-0.5 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[1rem]
          bg-[#001B3D] text-white shadow-[0_10px_24px_rgba(0,27,61,0.12)] print:bg-gray-200 print:text-black">
          <span className="text-[9px] font-bold uppercase leading-none opacity-70">Ficha</span>
          <span className="text-sm font-extrabold leading-none">{slotNumber}</span>
        </span>

        <div className="flex-1 min-w-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Time + tags */}
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0 text-[#64748B] print:hidden" />
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{time || period}</span>
              </div>
              {isHomeVisit && (
                <Badge className="border-[#D5E6FF] bg-[#EAF3FF] px-2 py-0.5 text-[11px] font-extrabold text-[#0F5AD8]">
                  Visita
                </Badge>
              )}
            </div>

          {/* Patient name – copyable */}
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 shrink-0 text-[#00A885] print:text-gray-500" />
            <p
              className="cursor-pointer truncate text-base font-extrabold text-[#001B3D]
                transition-colors hover:text-[#007A65] print:text-black"
              title="Toque para copiar o nome"
              onClick={() => handleCopy(appointment.patient_name, 'Nome')}
            >
              {appointment.patient_name}
            </p>
            <button
              onClick={() => handleCopy(appointment.patient_name, 'Nome')}
              className="shrink-0 text-[#94A3B8] transition-colors hover:text-[#64748B] print:hidden"
              title="Copiar nome"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          {/* Document row */}
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <FileText className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
            <p
              className="cursor-pointer truncate text-xs font-semibold text-[#64748B] transition-colors hover:text-[#001B3D]"
              onClick={() =>
                handleCopy(appointment.document_value.replace(/\D/g, ''), 'Documento')
              }
            >
              {formatDocument(appointment.document_type, appointment.document_value)}
            </p>
          </div>

          {/* ACS row */}
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <UserCheck className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
            <p className="truncate text-xs font-semibold text-[#64748B]">ACS: {appointment.acs_name}</p>
          </div>

            {/* Home visit extras – collapsible on mobile */}
            {hasExtraInfo && (
              <>
                {isExpanded && (
                  <div className="mt-3 space-y-1.5 rounded-[0.9rem] border border-[#DCE5EE] bg-[#F8FAFC] p-3">
                    {appointment.home_visit_address && (
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#00A885]" />
                        <p
                          className="cursor-pointer text-xs font-semibold text-[#334155] transition-colors hover:text-[#001B3D]"
                          onClick={() =>
                            handleCopy(appointment.home_visit_address || '', 'Endereço')
                          }
                        >
                          {appointment.home_visit_address}
                        </p>
                      </div>
                    )}
                    {appointment.home_visit_reference && (
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                        <p className="text-xs font-semibold text-[#64748B]">
                          Ref.: {appointment.home_visit_reference}
                        </p>
                      </div>
                    )}
                    {appointment.home_visit_reason && (
                      <div className="flex items-start gap-2 min-w-0">
                        <ClipboardList className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                        <p className="text-xs font-semibold text-[#64748B]">
                          Motivo: {appointment.home_visit_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Actions column ── */}
          <div className="flex w-full sm:w-auto sm:min-w-40 flex-col items-stretch gap-2 shrink-0 print:hidden">
            <Select
              value={status}
              onValueChange={value => onStatusChange(appointment, value as AppointmentStatus)}
            >
              <SelectTrigger
                className={`h-9 w-full rounded-full border px-3 text-xs font-extrabold shadow-none
                  ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}
                  hover:brightness-[0.98] focus:ring-2 focus:ring-[#00BB94]/30`}
              >
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

            {/* Icon buttons */}
            <div className="flex items-center justify-end gap-1">
              {hasExtraInfo && (
                <button
                  onClick={() => setIsExpanded(v => !v)}
                  className="rounded-[0.8rem] p-2 transition-colors hover:bg-[#E6F7F2]"
                  title={isExpanded ? 'Recolher' : 'Ver endereço'}
                >
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-[#64748B]" />
                    : <ChevronDown className="w-4 h-4 text-[#64748B]" />
                  }
                </button>
              )}
              <button
                onClick={() => onRescheduleClick(appointment)}
                className="rounded-[0.8rem] p-2 transition-colors hover:bg-[#EAF3FF]"
                title="Remarcar"
              >
                <CalendarClock className="w-4 h-4 text-[#64748B] hover:text-[#001B3D]" />
              </button>
              <button
                onClick={() => onConfirmationPdfClick(appointment)}
                className="rounded-[0.8rem] p-2 transition-colors hover:bg-[#EAF3FF]"
                title="Gerar confirmação em PDF"
              >
                <Printer className="w-4 h-4 text-[#64748B] hover:text-[#001B3D]" />
              </button>
              <button
                onClick={() => onEditClick(appointment)}
                className="rounded-[0.8rem] p-2 transition-colors hover:bg-[#E6F7F2]"
                title="Editar"
              >
                <Edit className="w-4 h-4 text-[#64748B] hover:text-[#001B3D]" />
              </button>
              <button
                onClick={() => onDeleteClick(appointment)}
                className="rounded-[0.8rem] p-2 transition-colors hover:bg-[#FFF7E6]"
                title="Marcar falta"
              >
                <Trash2 className="w-4 h-4 text-[#64748B] hover:text-[#9A5A00]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotCard;

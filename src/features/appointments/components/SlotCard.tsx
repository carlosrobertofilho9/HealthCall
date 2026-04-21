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
  Agendado:   { bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-500/20' },
  Compareceu: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  Faltou:     { bg: 'bg-amber-500/10',   text: 'text-amber-300',   border: 'border-amber-500/20' },
  Remarcado:  { bg: 'bg-purple-500/10',  text: 'text-purple-300',  border: 'border-purple-500/20' },
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
        className="group flex items-center gap-3 rounded-xl border-2 border-dashed border-border
          bg-background/40 px-4 py-3.5 cursor-pointer
          hover:border-primary/60 hover:bg-card active:scale-[0.99]
          transition-all duration-150 print:bg-white print:border-gray-300"
      >
        {/* Slot number */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
          bg-secondary text-muted-foreground text-xs font-bold group-hover:bg-primary/20
          group-hover:text-primary transition-colors print:bg-gray-100 print:text-gray-500">
          {slotNumber}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0 print:hidden" />
            <p className="text-xs text-muted-foreground font-medium">{time || period}</p>
          </div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-card-foreground transition-colors">
            {emptyLabel}
          </p>
        </div>

        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 print:hidden">
          Agendar →
        </span>
      </div>
    );
  }

  /* ── BLOCKED SLOT ── */
  const isBlocked = appointment.document_value === 'BLOQUEIO';

  if (isBlocked) {
    const blockedContainerClass = isAutoBlocked
      ? 'border-pink-400/30 bg-pink-500/10 print:bg-pink-50 print:border-pink-200'
      : 'border-red-900/30 bg-red-950/15 print:bg-white print:border-gray-300';
    const blockedBadgeClass = isAutoBlocked
      ? 'border-pink-400/30 bg-pink-500/15 text-pink-200 print:bg-pink-100 print:text-pink-800 print:border-pink-200'
      : 'border-red-900/30 bg-red-950/20 text-red-300';
    const blockedTimeClass = isAutoBlocked
      ? 'text-pink-200/80'
      : 'text-red-400/70';
    const blockedIconClass = isAutoBlocked
      ? 'text-pink-300'
      : 'text-red-500';
    const blockedTitleClass = isAutoBlocked
      ? 'text-pink-100 print:text-pink-900'
      : 'text-red-200';

    return (
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${blockedContainerClass}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${blockedBadgeClass}`}>
          {slotNumber}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className={`w-3 h-3 shrink-0 print:hidden ${isAutoBlocked ? 'text-pink-300/70' : 'text-red-400/50'}`} />
            <p className={`text-xs font-medium ${blockedTimeClass}`}>{time || period}</p>
          </div>
          <div className="flex items-center gap-2">
            <Ban className={`w-3.5 h-3.5 shrink-0 ${blockedIconClass}`} />
            <p className={`text-sm font-bold truncate ${blockedTitleClass}`}>
              {isAutoBlocked ? appointment.patient_name : `BLOQUEADO: ${appointment.patient_name}`}
            </p>
          </div>
        </div>

        {!isAutoBlocked && (
          <button
            onClick={() => onDeleteClick(appointment)}
            className="p-2.5 rounded-xl hover:bg-red-900/30 transition-colors shrink-0 print:hidden"
            title="Desbloquear"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
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
    <div className="rounded-xl border border-border bg-card overflow-hidden
      print:bg-white print:border-gray-300 transition-all">
      
      {/* ── Main row ── */}
      <div className="flex items-start gap-3 px-4 py-3.5">

        {/* Slot badge */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
          bg-primary text-primary-foreground text-xs font-bold mt-0.5 print:bg-gray-200 print:text-black">
          {slotNumber}
        </span>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Time + tags */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0 print:hidden" />
                <span className="text-xs text-muted-foreground font-medium">{time || period}</span>
              </div>
              {isHomeVisit && (
                <Badge className="border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                  Visita
                </Badge>
              )}
            </div>

          {/* Patient name – copyable */}
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-primary/70 shrink-0 print:text-gray-500" />
            <p
              className="text-sm font-semibold text-card-foreground truncate cursor-pointer
                hover:text-primary transition-colors print:text-black"
              title="Toque para copiar o nome"
              onClick={() => handleCopy(appointment.patient_name, 'Nome')}
            >
              {appointment.patient_name}
            </p>
            <button
              onClick={() => handleCopy(appointment.patient_name, 'Nome')}
              className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors print:hidden"
              title="Copiar nome"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          {/* Document row */}
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            <p
              className="text-xs text-muted-foreground truncate cursor-pointer hover:text-card-foreground transition-colors"
              onClick={() =>
                handleCopy(appointment.document_value.replace(/\D/g, ''), 'Documento')
              }
            >
              {formatDocument(appointment.document_type, appointment.document_value)}
            </p>
          </div>

          {/* ACS row */}
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            <p className="text-xs text-muted-foreground truncate">ACS: {appointment.acs_name}</p>
          </div>

            {/* Home visit extras – collapsible on mobile */}
            {hasExtraInfo && (
              <>
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                    {appointment.home_visit_address && (
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p
                          className="text-xs text-foreground/90 cursor-pointer hover:text-card-foreground transition-colors"
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
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Ref.: {appointment.home_visit_reference}
                        </p>
                      </div>
                    )}
                    {appointment.home_visit_reason && (
                      <div className="flex items-start gap-2 min-w-0">
                        <ClipboardList className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
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
                className={`h-8 w-full rounded-full border px-3 text-xs font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]
                  ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}
                  hover:brightness-110 focus:ring-2 focus:ring-primary/30`}
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
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title={isExpanded ? 'Recolher' : 'Ver endereço'}
                >
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
              )}
              <button
                onClick={() => onRescheduleClick(appointment)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Remarcar"
              >
                <CalendarClock className="w-4 h-4 text-muted-foreground hover:text-card-foreground" />
              </button>
              <button
                onClick={() => onConfirmationPdfClick(appointment)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Gerar confirmação em PDF"
              >
                <Printer className="w-4 h-4 text-muted-foreground hover:text-card-foreground" />
              </button>
              <button
                onClick={() => onEditClick(appointment)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Editar"
              >
                <Edit className="w-4 h-4 text-muted-foreground hover:text-card-foreground" />
              </button>
              <button
                onClick={() => onDeleteClick(appointment)}
                className="p-2 rounded-lg hover:bg-amber-900/30 transition-colors"
                title="Marcar falta"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-amber-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotCard;

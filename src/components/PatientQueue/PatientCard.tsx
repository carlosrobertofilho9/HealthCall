import React from 'react';
import type { Patient, PatientStatus } from '@/types';
import FinishServiceButton from './FinishServiceButton';
import {
  CheckCircle2,
  Clock,
  Edit,
  GripVertical,
  MapPin,
  Megaphone,
  Play,
  Trash2,
} from 'lucide-react';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PatientCardProps {
  patient: Patient;
  position: number;
  onEdit: (patient: Patient) => void;
  onCall: (id: string, destination: string) => void;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onRemove: () => void;
  onUpdateDestination: (id: string, destination: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const statusConfig: Record<
  PatientStatus,
  {
    card: string;
    rail: string;
    badge: string;
    dot: string;
    icon: React.ElementType;
    label: string;
  }
> = {
  Aguardando: {
    card: 'border-[#F0D799] bg-[#FFFDF7]',
    rail: 'bg-[#F59E0B]',
    badge: 'border-[#F0D799] bg-[#FFF4D8] text-[#875A00]',
    dot: 'bg-[#F59E0B]',
    icon: Clock,
    label: 'Aguardando',
  },
  Chamado: {
    card: 'border-[#BFD8FF] bg-[#F7FAFF] ring-1 ring-[#1466F5]/12',
    rail: 'bg-[#1466F5]',
    badge: 'border-[#BFD8FF] bg-[#EAF3FF] text-[#0F5AD8]',
    dot: 'bg-[#1466F5]',
    icon: Megaphone,
    label: 'Chamado',
  },
  'Em Atendimento': {
    card: 'border-[#BFECE1] bg-[#F7FCFA]',
    rail: 'bg-[#00BB94]',
    badge: 'border-[#BFECE1] bg-[#E6F7F2] text-[#007A65]',
    dot: 'bg-[#00BB94]',
    icon: Play,
    label: 'Em atendimento',
  },
  'Atendimento Finalizado': {
    card: 'border-[#E2E8F0] bg-[#F8FAFC]',
    rail: 'bg-[#94A3B8]',
    badge: 'border-[#CBD5E1] bg-[#F1F5F9] text-[#64748B]',
    dot: 'bg-[#94A3B8]',
    icon: CheckCircle2,
    label: 'Finalizado',
  },
};

const actionButtonBase =
  'flex size-9 items-center justify-center rounded-xl border transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-55';

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  position,
  onEdit,
  onCall,
  onUpdateStatus,
  onRemove,
  onUpdateDestination,
  dragHandleProps,
}) => {
  const isFinished = patient.status === 'Atendimento Finalizado';
  const canStartService = patient.status !== 'Atendimento Finalizado' && patient.status !== 'Em Atendimento';
  const statusStyles = statusConfig[patient.status] || statusConfig.Aguardando;
  const StatusIcon = statusStyles.icon;
  const callTooltip = patient.status === 'Aguardando' ? 'Chamar paciente' : 'Chamar novamente';

  return (
    <article
      className={cn(
        'group relative overflow-visible rounded-[1.25rem] border px-3 py-2.5 shadow-[0_8px_22px_rgba(0,27,61,0.05)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,27,61,0.09)]',
        statusStyles.card,
        isFinished && 'opacity-70',
      )}
    >
      <div className={cn('absolute inset-y-3 left-0 w-1 rounded-r-full', statusStyles.rail)} aria-hidden="true" />

      <div className="grid min-w-0 gap-2 pl-1 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <div className="flex items-center gap-2 sm:flex-col sm:gap-1.5">
          <Tooltip content="Mover na fila" side="right">
            <button
              type="button"
              {...dragHandleProps}
              aria-label={`Mover ${patient.name} na fila`}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#94A3B8] shadow-sm transition-colors hover:border-[#BFD8FF] hover:text-[#1466F5] active:scale-95',
                dragHandleProps?.className,
              )}
            >
              <GripVertical className="size-4" />
            </button>
          </Tooltip>
          <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-xl bg-[#001B3D] px-2 text-xs font-extrabold text-white">
            {String(position).padStart(2, '0')}
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <div className="flex min-w-0 items-start gap-2">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', statusStyles.dot)} aria-hidden="true" />
                <h3 className="min-w-0 text-[15px] font-extrabold leading-snug text-[#001B3D] line-clamp-2">
                  {patient.name}
                </h3>
              </div>

              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-bold">
                <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#DCE5EE] bg-white/80 px-2 py-1 text-[#475569]">
                  <MapPin className="size-3.5 shrink-0 text-[#00A885]" />
                  <span className="truncate">{patient.destination}</span>
                </div>
                <div className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1', statusStyles.badge)}>
                  <StatusIcon className="size-3.5" />
                  <span>{statusStyles.label}</span>
                </div>
                {patient.callCount > 0 && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-[#BFD8FF] bg-[#EAF3FF] px-2 py-1 text-[#0F5AD8]">
                    <Megaphone className="size-3.5" />
                    <span>{patient.callCount}ª chamada</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 lg:justify-end">
              <Tooltip content={callTooltip}>
                <button
                  className={cn(
                    actionButtonBase,
                    isFinished
                      ? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8]'
                      : 'border-[#1466F5] bg-[#1466F5] text-white shadow-[0_8px_18px_rgba(20,102,245,0.18)] hover:bg-[#0F5AD8]',
                  )}
                  aria-label={patient.status === 'Aguardando' ? `Chamar ${patient.name}` : `Chamar novamente ${patient.name}`}
                  onClick={() => onCall(patient.id, patient.destination)}
                  disabled={isFinished}
                >
                  <Megaphone className="size-4" />
                </button>
              </Tooltip>

              <Tooltip content="Iniciar atendimento">
                <button
                  className={cn(
                    actionButtonBase,
                    canStartService
                      ? 'border-[#BFECE1] bg-[#E6F7F2] text-[#007A65] hover:bg-[#D8F2EB]'
                      : 'border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8]',
                  )}
                  aria-label={`Iniciar atendimento de ${patient.name}`}
                  onClick={() => onUpdateStatus(patient.id, 'Em Atendimento')}
                  disabled={!canStartService}
                >
                  <Play className="size-4" />
                </button>
              </Tooltip>

              <FinishServiceButton
                patientId={patient.id}
                isFinished={isFinished}
                onUpdateStatus={onUpdateStatus}
                onUpdateDestination={onUpdateDestination}
              />

              <Tooltip content="Editar">
                <button
                  className={cn(
                    actionButtonBase,
                    isFinished
                      ? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#CBD5E1]'
                      : 'border-[#DCE5EE] bg-white text-[#64748B] hover:border-[#BFD8FF] hover:text-[#1466F5]',
                  )}
                  aria-label={`Editar ${patient.name}`}
                  onClick={() => onEdit(patient)}
                  disabled={isFinished}
                >
                  <Edit className="size-4" />
                </button>
              </Tooltip>

              <Tooltip content="Remover da fila">
                <button
                  className={cn(
                    actionButtonBase,
                    'border-[#F3D6D8] bg-white text-[#B4232D] hover:bg-[#FFF1F2] hover:text-[#8F1B24]',
                  )}
                  aria-label={`Remover ${patient.name} da fila`}
                  onClick={onRemove}
                >
                  <Trash2 className="size-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PatientCard;

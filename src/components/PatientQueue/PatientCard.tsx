import React from 'react';
import type { Patient, PatientStatus } from '@/types';
import FinishServiceButton from './FinishServiceButton';
import {
  Megaphone,
  Play,
  Edit,
  Trash2,
  MapPin,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui';

interface PatientCardProps {
  patient: Patient;
  position: number;
  onEdit: (patient: Patient) => void;
  onCall: (id: string, destination: string) => void;
  onUpdateStatus: (id: string, status: PatientStatus) => void;
  onRemove: (id: string) => void;
  onUpdateDestination: (id: string, destination: string) => void;
}

const statusConfig: Record<PatientStatus, { color: string; bg: string; border: string; icon: any }> = {
  // ... (keep existing config if not redeclared, but here I am redeclaring purely for context in replacement if needed, 
  // actually I can just leave the interface and component definition start)
  'Aguardando': { 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/50',
    icon: Clock 
  },
  'Chamado': { 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/50',
    icon: Megaphone
  },
  'Em Atendimento': { 
    color: 'text-green-400', 
    bg: 'bg-green-500/10', 
    border: 'border-green-500/50',
    icon: Play
  },
  'Atendimento Finalizado': { 
    color: 'text-gray-400', 
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/30',
    icon: Clock
  }
};

const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  position,
  onEdit, 
  onCall, 
  onUpdateStatus, 
  onRemove, 
  onUpdateDestination 
}) => {
  const isFinished = patient.status === 'Atendimento Finalizado';
  const canStartService = patient.status !== 'Atendimento Finalizado' && patient.status !== 'Em Atendimento';
  const statusStyles = statusConfig[patient.status] || statusConfig['Aguardando'];
  const StatusIcon = statusStyles.icon;

  return (
    <div
      className={`
        relative rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 
        transition-all duration-300 hover:bg-card hover:shadow-lg hover:border-border/90 hover:z-50 group
        ${patient.status === 'Chamado' ? 'ring-2 ring-blue-500/30 ring-offset-2 ring-offset-transparent' : ''}
        ${isFinished ? 'opacity-60 grayscale-[0.5]' : ''}
      `}
    >
      {/* Decorative Status Bar on Left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${statusStyles.bg.replace('/10', '/80')} ${patient.status === 'Chamado' ? 'animate-pulse' : ''}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-3">
        
        {/* Position Indicator */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-8">
            <span className="text-2xl font-bold text-muted-foreground/40 font-mono leading-none">
                {String(position).padStart(2, '0')}
            </span>
        </div>
        {/* Main Info */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-card-foreground tracking-tight">{patient.name}</h3>
            {patient.callCount > 0 && (
              <Badge className="gap-1.5 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                <Megaphone size={10} className="stroke-3" />
                {patient.callCount}ª chamada
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground font-medium">{patient.destination}</span>
            </div>
            <div className={`flex items-center gap-1.5 font-medium ${statusStyles.color}`}>
               <StatusIcon size={14} className={patient.status === 'Chamado' ? 'animate-bounce' : ''} />
               <span>{patient.status}</span>
            </div>
          </div>
        </div>

        {/* Actions - Grouped */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          
          {/* Primary Actions Group */}
          <div className="flex items-center gap-1 bg-secondary/20 p-1 rounded-lg border border-border">
            <button
              className={`
                flex items-center justify-center rounded-md h-9 w-9 transition-all active:scale-95
                ${isFinished 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'}
              `}
              title={patient.status === 'Aguardando' ? 'Chamar Paciente' : 'Chamar Novamente'}
              onClick={() => onCall(patient.id, patient.destination)}
              disabled={isFinished}
            >
              <Megaphone size={18} className={patient.status === 'Chamado' ? 'animate-pulse' : ''} />
            </button>

            <button
              className={`
                flex items-center justify-center rounded-md h-9 w-9 transition-all active:scale-95
                ${canStartService
                  ? 'text-green-400 hover:bg-green-500/20 hover:text-green-300'
                  : 'text-gray-600 cursor-not-allowed'}
              `}
              title="Iniciar Atendimento"
              onClick={() => onUpdateStatus(patient.id, 'Em Atendimento')}
              disabled={!canStartService}
            >
              <Play size={18} />
            </button>

            {/* Injected Finish Button - Wrapper to make it fit if needed, but the component itself manages styles. 
                Ideally we should pass a prop to FinishServiceButton to match this style, 
                but for now we'll assume it renders its own button.
            */}
            <FinishServiceButton
              patientId={patient.id}
              isFinished={isFinished}
              onUpdateStatus={onUpdateStatus}
              onUpdateDestination={onUpdateDestination}
            />
          </div>

          {/* Secondary Actions Group (Edit/Remove) */}
          <div className="flex items-center gap-1">
             <button
              className={`
                flex items-center justify-center rounded-full h-8 w-8 transition-colors
                ${isFinished
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-400'}
              `}
              title="Editar"
              onClick={() => onEdit(patient)}
              disabled={isFinished}
            >
              <Edit size={16} />
            </button>
            <button
              className="flex items-center justify-center rounded-full h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Remover da Fila"
              onClick={() => onRemove(patient.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;

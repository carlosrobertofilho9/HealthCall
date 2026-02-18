import React from 'react';
import { User, FileText, UserCheck, Trash2, Edit, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentSlot, Appointment } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';

interface SlotCardProps {
  slot: AppointmentSlot;
  onAddClick: (slotNumber: number) => void;
  onEditClick: (appointment: Appointment) => void;
  onDeleteClick: (appointment: Appointment) => void;
}

/**
 * Card que representa um slot na grade de marcações.
 * Pode estar vazio (disponível) ou preenchido com uma marcação.
 */
export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  const { slotNumber, period, time, isReserve, appointment } = slot;

  const formatDocument = (type: string, value: string): string => {
    if (type === 'CPF') {
      return `CPF: ${formatCPF(value)}`;
    }
    return `Cartão SUS: ${formatCNS(value)}`;
  };

  const handleCopy = async (text: string, type: 'nome' | 'documento') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type === 'nome' ? 'Nome' : 'Documento'} copiado!`);
    } catch (err) {
      console.error('Falha ao copiar:', err);
      toast.error('Erro ao copiar');
    }
  };

  // Slot vazio - disponível para marcação
  if (!appointment) {
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
                Vaga disponível
              </p>
            </div>
          </div>
          <span className="text-[#96c5a9] text-sm opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
            Clique para agendar
          </span>
        </div>
      </div>
    );
  }

  // Verifica se é um bloqueio
  const isBlocked = appointment.document_value === 'BLOQUEIO';

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
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0 print:hidden">
          <button
            onClick={() => onEditClick(appointment)}
            className="p-3 md:p-2 rounded-full hover:bg-[#264532] transition-colors"
            title="Editar"
          >
            <Edit className="w-5 h-5 md:w-4 md:h-4 text-[#96c5a9] hover:text-white" />
          </button>
          <button
            onClick={() => onDeleteClick(appointment)}
            className="p-3 md:p-2 rounded-full hover:bg-red-900/30 transition-colors"
            title="Remover"
          >
            <Trash2 className="w-5 h-5 md:w-4 md:h-4 text-[#96c5a9] hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotCard;

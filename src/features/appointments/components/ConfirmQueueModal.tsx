import React from 'react';
import { Users, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmQueueModalProps {
  patientCount: number;
  period: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * Modal de confirmação para enviar pacientes para a fila.
 */
export const ConfirmQueueModal: React.FC<ConfirmQueueModalProps> = ({
  patientCount,
  period,
  onConfirm,
  onClose,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-[#1a2c22] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md safe-area-bottom">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-white">Enviar para Fila</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl active:bg-[#264532] hover:bg-[#264532] transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-white text-lg mb-2">
            Confirmar envio para triagem?
          </p>
          <div className="bg-[#264532] p-4 rounded-xl">
             <p className="text-[#96c5a9] mb-1">Periodo: <strong className="text-white">{period}</strong></p>
             <p className="text-[#96c5a9]">Pacientes: <strong className="text-white">{patientCount}</strong></p>
          </div>
          <p className="text-[#96c5a9] text-sm mt-4">
            Isso adicionará todos os pacientes listados acima à fila de atendimento da triagem.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#264532] text-white font-semibold active:bg-[#305a3e] hover:bg-[#305a3e] transition-colors touch-manipulation"
          >
            Cancelar
          </button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 touch-manipulation"
          >
            {isLoading ? 'Enviando...' : 'Confirmar Envio'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmQueueModal;

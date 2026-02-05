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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a3a26] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Enviar para Fila</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#264532] transition-colors"
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
            className="flex-1 py-3 px-4 rounded-full bg-[#264532] text-white font-semibold hover:bg-[#305a3e] transition-colors"
          >
            Cancelar
          </button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Enviando...' : 'Confirmar Envio'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmQueueModal;

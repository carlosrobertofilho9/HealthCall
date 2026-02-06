import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteAppointmentModalProps {
  patientName: string;
  slotNumber: number;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * Modal de confirmação para remover uma marcação.
 */
export const ConfirmDeleteAppointmentModal: React.FC<ConfirmDeleteAppointmentModalProps> = ({
  patientName,
  slotNumber,
  onConfirm,
  onClose,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-[#1a2c22] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md safe-area-bottom">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-white">Confirmar Remoção</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl active:bg-[#264532] hover:bg-[#264532] transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="text-center mb-6">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">
            Tem certeza que deseja remover a marcação?
          </p>
          <p className="text-[#96c5a9]">
            <strong className="text-white">{patientName}</strong>
            <br />
            Slot {slotNumber}
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
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 touch-manipulation"
          >
            {isLoading ? 'Removendo...' : 'Remover'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteAppointmentModal;

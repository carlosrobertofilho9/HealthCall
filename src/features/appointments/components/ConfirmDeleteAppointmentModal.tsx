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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a3a26] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Confirmar Remoção</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#264532] transition-colors"
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
            className="flex-1 py-3 px-4 rounded-full bg-[#264532] text-white font-semibold hover:bg-[#305a3e] transition-colors"
          >
            Cancelar
          </button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Removendo...' : 'Remover'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteAppointmentModal;

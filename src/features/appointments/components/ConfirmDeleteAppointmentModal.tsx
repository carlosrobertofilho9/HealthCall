import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

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
    <Modal
      isOpen
      onClose={onClose}
      position="bottom"
      showMobileHandle
      panelClassName="p-5 sm:p-6"
    >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-card-foreground">Confirmar Remoção</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl active:bg-secondary hover:bg-secondary transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-card-foreground" />
          </button>
        </div>

        <div className="text-center mb-6">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-card-foreground text-lg mb-2">
            Tem certeza que deseja remover a marcação?
          </p>
          <p className="text-muted-foreground">
            <strong className="text-card-foreground">{patientName}</strong>
            <br />
            Slot {slotNumber}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-secondary text-secondary-foreground font-semibold active:bg-secondary/90 hover:bg-secondary/90 transition-colors touch-manipulation"
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
    </Modal>
  );
};

export default ConfirmDeleteAppointmentModal;

import React from 'react';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
}

/**
 * A modal component to confirm the deletion of a patient.
 * @param {ConfirmDeleteModalProps} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {() => void} props.onClose - Callback function to close the modal.
 * @param {() => void} props.onConfirm - Callback function to execute upon confirming deletion.
 * @param {string} props.patientName - The name of the patient to be displayed in the confirmation message.
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, patientName }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="relative max-w-md p-8 shadow-sm">
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="text-left mb-8">
          <h2 className="text-card-foreground text-2xl font-bold leading-tight">Confirmar Exclusão</h2>
          <p className="text-muted-foreground mt-1">
            Tem certeza que deseja remover <span className="font-bold text-card-foreground">{patientName}</span> da fila?
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
          >
            Confirmar
          </Button>
        </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;

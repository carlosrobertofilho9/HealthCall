import React from 'react';
import { Users, X } from 'lucide-react';
import { Button, ActionBar, Modal } from '@/components/ui';

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
    <Modal
      isOpen
      onClose={onClose}
      position="bottom"
      showMobileHandle
      panelClassName="p-5 sm:p-6"
    >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-card-foreground">Enviar para Fila</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl active:bg-secondary hover:bg-secondary transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-card-foreground" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-card-foreground text-lg mb-2">
            Confirmar envio para triagem?
          </p>
          <div className="bg-secondary p-4 rounded-xl">
             <p className="text-muted-foreground mb-1">Periodo: <strong className="text-card-foreground">{period}</strong></p>
             <p className="text-muted-foreground">Pacientes: <strong className="text-card-foreground">{patientCount}</strong></p>
          </div>
          <p className="text-muted-foreground text-sm mt-4">
            Isso adicionará todos os pacientes listados acima à fila de atendimento da triagem.
          </p>
        </div>

        <ActionBar className="gap-3" align="between">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="flex-1 py-3.5 touch-manipulation"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 touch-manipulation"
          >
            {isLoading ? 'Enviando...' : 'Confirmar Envio'}
          </Button>
        </ActionBar>
    </Modal>
  );
};

export default ConfirmQueueModal;

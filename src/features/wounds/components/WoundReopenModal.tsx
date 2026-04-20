import React, { useState } from 'react';
import { Button, Modal, Textarea } from '@/components/ui';

interface WoundReopenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: string }) => Promise<void>;
}

const WoundReopenModal: React.FC<WoundReopenModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonError = reason.trim().length === 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reasonError) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ reason });
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="max-w-lg p-4 sm:p-5">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-foreground">Reabrir ferida encerrada</h3>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Justificativa*</label>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Descreva o motivo da reabertura"
            required
          />
          {reasonError && <p className="text-xs text-destructive">A justificativa é obrigatória.</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={reasonError || isSubmitting}>
            {isSubmitting ? 'Reabrindo...' : 'Confirmar reabertura'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WoundReopenModal;

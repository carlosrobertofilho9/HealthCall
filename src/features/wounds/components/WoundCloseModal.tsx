import React, { useState } from 'react';
import { Button, Input, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui';
import type { WoundClosureType } from '../types';
import { validateWoundImageFiles } from '../utils/woundFileValidation';

interface WoundCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    closure_type: WoundClosureType;
    closure_date: string;
    closure_reason: string;
    finalPhoto: File | null;
  }) => Promise<void>;
}

const closureTypeLabel: Record<WoundClosureType, string> = {
  alta: 'Alta',
  autocuidado: 'Curativo pelo próprio paciente',
  ubs: 'Curativo na UBS',
};

const WoundCloseModal: React.FC<WoundCloseModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [closureType, setClosureType] = useState<WoundClosureType>('alta');
  const [closureDate, setClosureDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [closureReason, setClosureReason] = useState('');
  const [finalPhoto, setFinalPhoto] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonError = closureReason.trim().length === 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reasonError || fileError) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        closure_type: closureType,
        closure_date: closureDate,
        closure_reason: closureReason,
        finalPhoto,
      });

      setClosureReason('');
      setFinalPhoto(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="max-w-xl p-4 sm:p-5">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-foreground">Encerrar acompanhamento da ferida</h3>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de fechamento*</label>
          <Select value={closureType} onValueChange={(value) => setClosureType(value as WoundClosureType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(closureTypeLabel) as WoundClosureType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {closureTypeLabel[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data de fechamento*</label>
          <Input type="date" value={closureDate} onChange={(event) => setClosureDate(event.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motivo/observações*</label>
          <Textarea
            value={closureReason}
            onChange={(event) => setClosureReason(event.target.value)}
            placeholder="Descreva o motivo do fechamento"
            required
          />
          {reasonError && (
            <p className="text-xs text-destructive">O motivo do fechamento é obrigatório.</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="wound-close-final-photo" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Foto final (opcional)
          </label>
          <Input
            id="wound-close-final-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const selectedFile = (event.target.files ?? [])[0] ?? null;

              if (!selectedFile) {
                setFinalPhoto(null);
                setFileError(null);
                return;
              }

              const validation = validateWoundImageFiles([selectedFile]);
              if (!validation.isValid) {
                setFinalPhoto(null);
                setFileError(validation.error);
                event.target.value = '';
                return;
              }

              setFinalPhoto(selectedFile);
              setFileError(null);
            }}
          />
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          {!fileError && <p className="text-xs text-muted-foreground">Apenas imagem de até 5MB.</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || reasonError || !!fileError}>
            {isSubmitting ? 'Encerrando...' : 'Confirmar encerramento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WoundCloseModal;

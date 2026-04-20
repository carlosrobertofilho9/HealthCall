import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Modal, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  Textarea 
} from '@/components/ui';
import type { WoundClosureType } from '../types';
import { validateWoundImageFiles } from '../utils/woundFileValidation';
import { Calendar, CheckCircle, Camera, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-foreground">Encerrar Acompanhamento</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Tipo de fechamento*</label>
          <Select value={closureType} onValueChange={(value) => setClosureType(value as WoundClosureType)}>
            <SelectTrigger icon={<CheckCircle className={cn("h-4 w-4", closureType ? "text-emerald-500" : "text-muted-foreground/40")} />}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(closureTypeLabel) as WoundClosureType[]).map((type) => (
                <SelectItem key={type} value={type} icon={<CheckCircle className="h-3.5 w-3.5 text-emerald-500/50" />}>
                  {closureTypeLabel[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Data de fechamento*</label>
          <Input 
            type="date" 
            icon={<Calendar className="h-4 w-4" />}
            value={closureDate} 
            onChange={(event) => setClosureDate(event.target.value)} 
            required 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">Motivo / Observações*</label>
          <Textarea
            value={closureReason}
            onChange={(event) => setClosureReason(event.target.value)}
            placeholder="Descreva detalhadamente o estado da ferida no fechamento..."
            required
            className="min-h-[100px]"
          />
          {reasonError && (
            <p className="text-[10px] text-destructive font-bold ml-1">O motivo do fechamento é obrigatório.</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="wound-close-final-photo" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
            Foto final (opcional)
          </label>
          <div className="relative">
            <Input
              id="wound-close-final-photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
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
            <label 
              htmlFor="wound-close-final-photo"
              className="flex items-center justify-center gap-2 border-2 border-dashed rounded-full h-11 px-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase">
                {finalPhoto ? 'Foto Selecionada' : 'Anexar Foto de Fechamento'}
              </span>
            </label>
            {fileError && <p className="text-[10px] text-destructive font-bold mt-1 ml-1">{fileError}</p>}
          </div>
        </div>

        <div className="flex flex-col pt-2 gap-2">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || reasonError || !!fileError}
            className="w-full rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Encerrando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Confirmar Encerramento
              </>
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WoundCloseModal;

import React, { useCallback, useState } from 'react';
import { FileUp, Upload, X, FileText } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  prescriptionName: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const PrescriptionUploadModal: React.FC<PrescriptionUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  prescriptionName,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Apenas arquivos PDF são permitidos.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'O arquivo excede o limite de 10MB.';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
    onClose();
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} panelClassName="max-w-md rounded-2xl">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Enviar PDF da Receita
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Paciente: <span className="font-semibold text-foreground">{prescriptionName}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative rounded-xl border-2 border-dashed p-8 text-center transition-all',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-accent/50 hover:bg-accent'
          )}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-10 w-10 text-primary" />
              <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className="mt-1 text-muted-foreground hover:text-foreground"
              >
                Remover arquivo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className={cn('h-10 w-10', isDragging ? 'text-primary' : 'text-muted-foreground')} />
              <p className="text-sm font-semibold text-foreground">
                Clique ou arraste o PDF aqui
              </p>
              <p className="text-xs text-muted-foreground">Máximo 10MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            className="flex-1 rounded-xl"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Enviando...' : 'Confirmar Upload'}
          </Button>
          <Button variant="secondary" className="rounded-xl" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PrescriptionUploadModal;

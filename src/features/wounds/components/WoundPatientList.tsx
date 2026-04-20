import React, { useMemo, useState } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import type { CreateWoundPatientInput, WoundPatientWithSummary } from '../types';
import { Search, UserPlus, UserMinus, PencilLine } from 'lucide-react';
import {
  detectDocumentoPacienteTipo,
  formatDocumentoPaciente,
  isValidCNS,
  isValidCPF,
} from '@/lib/utils';

interface WoundPatientListProps {
  patients: WoundPatientWithSummary[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onCreatePatient: (input: CreateWoundPatientInput) => Promise<unknown>;
  onUpdatePatient: (patientId: string, input: Partial<CreateWoundPatientInput>) => Promise<unknown>;
  onDeletePatient?: (patientId: string) => Promise<unknown>;
  showForm?: boolean;
  onToggleForm?: () => void;
}

const WoundPatientList: React.FC<WoundPatientListProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onCreatePatient,
  onUpdatePatient,
  onDeletePatient,
  showForm,
  onToggleForm,
}) => {
  const [internalShowForm, setInternalShowForm] = useState(false);
  const activeShowForm = showForm !== undefined ? showForm : internalShowForm;
  
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fullName, setFullName] = useState('');
  const [documentValue, setDocumentValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      return (
        patient.full_name.toLowerCase().includes(term) ||
        patient.document_value.toLowerCase().includes(term)
      );
    });
  }, [patients, search]);

  const documentDigits = useMemo(() => documentValue.replace(/\D/g, ''), [documentValue]);
  const detectedType = useMemo(() => detectDocumentoPacienteTipo(documentDigits), [documentDigits]);

  const documentError = useMemo(() => {
    if (!documentDigits) return 'CPF ou CNS é obrigatório.';

    if (detectedType === 'CPF' && !isValidCPF(documentDigits)) {
      return 'CPF inválido. Verifique os 11 dígitos.';
    }

    if (detectedType === 'CNS' && !isValidCNS(documentDigits)) {
      return 'CNS inválido. Verifique os 15 dígitos.';
    }

    return null;
  }, [detectedType, documentDigits]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!fullName.trim() || documentError || !detectedType) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPatientId) {
        await onUpdatePatient(editingPatientId, {
          full_name: fullName.trim(),
          document_type: detectedType,
          document_value: documentDigits,
        });
      } else {
        await onCreatePatient({
          full_name: fullName.trim(),
          document_type: detectedType,
          document_value: documentDigits,
        });
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setDocumentValue('');
    if (onToggleForm) {
      if (activeShowForm) onToggleForm();
    } else {
      setInternalShowForm(false);
    }
    setEditingPatientId(null);
  };

  const handleEdit = (event: React.MouseEvent, patient: WoundPatientWithSummary) => {
    event.stopPropagation();
    setEditingPatientId(patient.id);
    setFullName(patient.full_name);
    setDocumentValue(formatDocumentoPaciente(patient.document_value).formatado);
    if (onToggleForm) {
      if (!activeShowForm) onToggleForm();
    } else {
      setInternalShowForm(true);
    }
  };

  const handleDelete = async (event: React.MouseEvent, patient: WoundPatientWithSummary) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Explicitly check for window to avoid SSR issues and for clarity
    if (typeof window === 'undefined') return;

    const confirmed = window.confirm(
      `ATENÇÃO: Você está prestes a excluir permanentemente o paciente "${patient.full_name}" e todos os registros de feridas, evoluções e fotos.\n\nEsta ação NÃO pode ser desfeita. Deseja continuar?`
    );

    if (confirmed && onDeletePatient) {
      try {
        await onDeletePatient(patient.id);
      } catch (error) {
        console.error('[WoundPatientList] Critical error deleting patient:', error);
        // Fallback alert if toast fails or to ensure visibility
        alert('Ocorreu um erro ao excluir o paciente. Verifique sua conexão ou permissões.');
      }
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full overflow-hidden">
      {activeShowForm && (
        <form className="space-y-2 rounded-xl border border-border p-3" onSubmit={handleSubmit}>
          <p className="text-xs font-bold text-primary mb-1">
            {editingPatientId ? 'Editando paciente' : 'Novo paciente'}
          </p>
          <p className="text-xs text-muted-foreground">Campos obrigatórios: <strong>Nome do paciente</strong> e <strong>CPF/CNS</strong>.</p>
          <Input
            placeholder="Nome do paciente *"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />

          <Input
            placeholder="CPF ou CNS *"
            value={documentValue}
            onChange={(event) => {
              const normalized = formatDocumentoPaciente(event.target.value);
              setDocumentValue(normalized.formatado);
            }}
            required
          />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Tipo detectado:</span>
            <Badge variant="outline">{detectedType ?? '-'}</Badge>
          </div>

          {documentError && <p className="text-xs text-destructive">{documentError}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting || !!documentError}>
              {isSubmitting ? 'Salvando...' : editingPatientId ? 'Atualizar paciente' : 'Salvar paciente'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar paciente"
        icon={<Search className="h-4 w-4" />}
      />

      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {filteredPatients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhum paciente em acompanhamento.
          </p>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className={`group relative w-full rounded-xl border p-3 transition-colors ${
                selectedPatientId === patient.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:border-primary/40'
              }`}
            >
              <div 
                className="cursor-pointer"
                onClick={() => onSelectPatient(patient.id)}
              >
                <div className="pr-14">
                  <p className="text-sm font-semibold text-foreground truncate">{patient.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {patient.document_type}: {formatDocumentoPaciente(patient.document_value).formatado}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={patient.open_wounds_count > 0 ? 'warning' : 'muted'}>
                    Abertas: {patient.open_wounds_count}
                  </Badge>
                  <Badge variant="outline">Total: {patient.wounds.length}</Badge>
                </div>
              </div>

              <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handleEdit(e, patient)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  title="Editar paciente"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                
                {onDeletePatient && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, patient)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir paciente"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WoundPatientList;


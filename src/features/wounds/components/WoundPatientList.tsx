import React, { useMemo, useState } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import type { CreateWoundPatientInput, WoundPatientWithSummary } from '../types';
import { Search, UserPlus, Trash2 } from 'lucide-react';
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
  onDeletePatient?: (patientId: string) => Promise<unknown>;
}

const WoundPatientList: React.FC<WoundPatientListProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onCreatePatient,
  onDeletePatient,
}) => {
  const [showForm, setShowForm] = useState(false);
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
      await onCreatePatient({
        full_name: fullName.trim(),
        document_type: detectedType,
        document_value: documentDigits,
      });
      setFullName('');
      setDocumentValue('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Pacientes em acompanhamento</h2>
        <Button type="button" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <UserPlus className="h-4 w-4" />
          Novo paciente
        </Button>
      </div>

      {showForm && (
        <form className="space-y-2 rounded-xl border border-border p-3" onSubmit={handleSubmit}>
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
              {isSubmitting ? 'Salvando...' : 'Salvar paciente'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
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

      <div className="space-y-2 pr-1">
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
                <p className="text-sm font-semibold text-foreground">{patient.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {patient.document_type}: {formatDocumentoPaciente(patient.document_value).formatado}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={patient.open_wounds_count > 0 ? 'warning' : 'muted'}>
                    Abertas: {patient.open_wounds_count}
                  </Badge>
                  <Badge variant="outline">Total: {patient.wounds.length}</Badge>
                </div>
              </div>

              {onDeletePatient && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, patient)}
                  className="absolute right-2 top-2 z-20 rounded-lg p-2 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  title="Excluir paciente"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WoundPatientList;

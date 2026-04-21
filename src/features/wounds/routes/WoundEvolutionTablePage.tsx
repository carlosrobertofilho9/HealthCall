import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import WoundEvolutionTable from '../components/WoundEvolutionTable';
import WoundEvolutionForm from '../components/WoundEvolutionForm';
import { Modal } from '@/components/ui';
import { useWounds } from '../hooks/useWounds';
import { getWoundCaseContext } from '../services/woundService';
import type { WoundCase, WoundEntry, WoundPatient } from '../types';

const WoundEvolutionTablePage: React.FC = () => {
  const { woundId } = useParams<{ woundId: string }>();
  const navigate = useNavigate();
  const {
    entries,
    patients,
    photos,
    events,
    selectedWound,
    loading,
    error,
    setSelectedWoundId,
    updateEntry,
    removeEntry,
  } = useWounds();

  const [showEditEntryModal, setShowEditEntryModal] = React.useState(false);
  const [showDeleteEntryModal, setShowDeleteEntryModal] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<WoundEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = React.useState<WoundEntry | null>(null);
  const [fallbackPatient, setFallbackPatient] = React.useState<Pick<WoundPatient, 'full_name' | 'document_type' | 'document_value'> | null>(null);
  const [fallbackWound, setFallbackWound] = React.useState<Pick<WoundCase, 'id' | 'anatomical_code' | 'started_at' | 'classification' | 'etiology' | 'comorbidities' | 'status' | 'closure_date'> | null>(null);

  useEffect(() => {
    if (!woundId) return;
    setSelectedWoundId(woundId);
  }, [setSelectedWoundId, woundId]);

  useEffect(() => {
    if (!woundId) return;

    let cancelled = false;

    void (async () => {
      try {
        const context = await getWoundCaseContext(woundId);
        if (cancelled) return;
        setFallbackPatient(context.patient);
        setFallbackWound(context.wound);
      } catch {
        if (cancelled) return;
        setFallbackPatient(null);
        setFallbackWound(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [woundId]);

  const selectedPatient = useMemo(() => {
    if (selectedWound) {
      const fromSelected = patients.find((patient) => patient.id === selectedWound.patient_id) ?? null;
      if (fromSelected) return fromSelected;
    }

    if (woundId) {
      const fromSummary = patients.find((patient) => patient.wounds.some((wound) => wound.id === woundId)) ?? null;
      if (fromSummary) return fromSummary;
    }

    return fallbackPatient;
  }, [fallbackPatient, patients, selectedWound, woundId]);

  const resolvedWound = selectedWound ?? fallbackWound;

  if (!woundId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-destructive">ID da ferida não fornecido.</p>
        <Button onClick={() => navigate('/wounds')}>Voltar para Curativos</Button>
      </div>
    );
  }

  const handleEditEntrySubmit = async (input: Parameters<typeof updateEntry>[1]) => {
    if (!editingEntry || !woundId) return;
    await updateEntry(editingEntry.id, input, woundId);
    setShowEditEntryModal(false);
    setEditingEntry(null);
  };

  const handleDeleteEntryConfirm = async () => {
    if (!deletingEntry || !woundId) return;
    await removeEntry(deletingEntry.id, woundId);
    setShowDeleteEntryModal(false);
    setDeletingEntry(null);
  };

  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full lg:overflow-y-auto">
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wounds')} className="-ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tabela de Evolução</h1>
          <p className="text-sm text-muted-foreground">
            Visualização completa para evolução clínica com cards no mobile e tabela detalhada no desktop.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <WoundEvolutionTable
        entries={entries}
        photos={photos}
        mode="page"
        patient={selectedPatient}
        wound={resolvedWound}
        onEditEntry={(entry) => {
          setEditingEntry(entry);
          setShowEditEntryModal(true);
        }}
        onDeleteEntry={(entry) => {
          setDeletingEntry(entry);
          setShowDeleteEntryModal(true);
        }}
      />

      <Modal
        isOpen={showEditEntryModal}
        onClose={() => setShowEditEntryModal(false)}
        panelClassName="max-h-[90vh] max-w-4xl overflow-y-auto p-4 sm:p-5"
      >
        <WoundEvolutionForm
          woundId={woundId}
          initialEntry={editingEntry}
          onSubmit={handleEditEntrySubmit}
          onCancel={() => setShowEditEntryModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showDeleteEntryModal}
        onClose={() => setShowDeleteEntryModal(false)}
        panelClassName="max-w-md p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Excluir Evolução</h3>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta evolução? Esta ação não pode ser desfeita e removerá permanentemente o registro e todas as fotos vinculadas a ele.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowDeleteEntryModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEntryConfirm}>Confirmar Exclusão</Button>
          </div>
        </div>
      </Modal>

      {loading && <p className="text-xs text-muted-foreground">Carregando dados de curativos...</p>}
    </div>
  );
};

export default WoundEvolutionTablePage;

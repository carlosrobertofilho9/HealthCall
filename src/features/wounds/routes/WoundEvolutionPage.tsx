import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { PageShell } from '@/components/layout';
import { ChevronLeft } from 'lucide-react';
import WoundEvolutionForm from '../components/WoundEvolutionForm';
import { useWounds } from '../hooks/useWounds';
import { useWoundSync } from '../hooks/useWoundSync';
import WoundSyncIndicator from '../components/WoundSyncIndicator';

const WoundEvolutionPage: React.FC = () => {
  const { woundId } = useParams<{ woundId: string }>();
  const navigate = useNavigate();
  const {
    selectedWound,
    patients,
    entries,
    createEntryWithPhotos,
    persistDraft,
    restoreDraft,
    clearDraft,
    setSelectedWoundId,
    setSelectedPatientId,
    loading,
  } = useWounds();

  const {
    isOnline,
    isSyncing,
    summary,
    syncNow,
  } = useWoundSync();

  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (woundId) {
      setSelectedWoundId(woundId);
    }
  }, [setSelectedWoundId, woundId]);

  useEffect(() => {
    if (!woundId) return;

    void (async () => {
      const restored = await restoreDraft(woundId);
      setDraft(restored);
    })();
  }, [restoreDraft, woundId]);

  // Encontrar o paciente associado à ferida
  const patient = useMemo(() => {
    if (!selectedWound || !patients.length) return null;
    return patients.find(p => p.id === selectedWound.patient_id) || null;
  }, [patients, selectedWound]);

  const lastEntry = useMemo(() => entries[0] ?? null, [entries]);

  const handleEvolutionSubmit = async (input: Parameters<typeof createEntryWithPhotos>[0], files: File[]) => {
    await createEntryWithPhotos(input, files);
    navigate('/wounds');
  };

  const handleDraftChange = useCallback(async (nextDraft: Record<string, unknown>) => {
    if (!woundId) return;
    setDraft((prev) => (prev === nextDraft ? prev : nextDraft));
    await persistDraft(woundId, nextDraft);
  }, [persistDraft, woundId]);

  const handleDraftClear = useCallback(async () => {
    if (!woundId) return;
    setDraft(null);
    await clearDraft(woundId);
  }, [clearDraft, woundId]);

  if (!woundId) {
    return (
      <PageShell className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-destructive">ID da ferida não fornecido.</p>
        <Button onClick={() => navigate('/wounds')}>Voltar para Curativos</Button>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wounds')} className="-ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nova Evolução</h1>
          {patient && selectedWound && (
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-semibold text-foreground">{patient.full_name}</span> • 
              Ferida: <span className="font-semibold text-foreground">{selectedWound.anatomical_code}</span>
            </p>
          )}
          {loading && !selectedWound && <p className="text-xs text-muted-foreground animate-pulse">Carregando detalhes...</p>}
        </div>
      </header>

      <WoundSyncIndicator
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={summary.pendingCount}
        conflictCount={summary.conflictCount}
        onSyncNow={() => {
          void syncNow();
        }}
      />

      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <WoundEvolutionForm
          woundId={woundId}
          lastEntry={lastEntry}
          initialDraft={draft}
          onSubmit={handleEvolutionSubmit}
          onDraftChange={handleDraftChange}
          onDraftClear={handleDraftClear}
          onCancel={() => navigate('/wounds')}
        />
      </div>
    </PageShell>
  );
};

export default WoundEvolutionPage;

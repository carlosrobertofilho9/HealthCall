import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import BodyDiagram from '@/components/clinical/BodyDiagram';
import WoundPatientList from '../components/WoundPatientList';
import WoundCaseList from '../components/WoundCaseList';
import WoundCaseHeader from '../components/WoundCaseHeader';
import NewWoundForm from '../components/NewWoundForm';
import WoundTimeline from '../components/WoundTimeline';
import WoundGallery from '../components/WoundGallery';
import WoundPhotoComparator from '../components/WoundPhotoComparator';
import WoundEvolutionTable from '../components/WoundEvolutionTable';
import WoundCloseModal from '../components/WoundCloseModal';
import WoundReopenModal from '../components/WoundReopenModal';
import WoundSyncIndicator from '../components/WoundSyncIndicator';
import { useWounds } from '../hooks/useWounds';
import { useWoundSync } from '../hooks/useWoundSync';
import { createOfflineId, saveWoundPhotoBlob } from '../services/woundOfflineStore';
import { queueWoundMutation } from '../services/woundSyncService';

const WoundsPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    patients,
    wounds,
    entries,
    photos,
    selectedWound,
    selectedPatientId,
    selectedWoundId,
    loading,
    error,
    setSelectedPatientId,
    setSelectedWoundId,
    refreshWounds,
    createPatient,
    createCase,
    createEntryWithPhotos,
    closeCase,
    reopenCase,
    removePhoto,
    persistDraft,
    restoreDraft,
    clearDraft,
  } = useWounds();

  const {
    isOnline,
    isSyncing,
    summary,
    conflicts,
    syncNow,
  } = useWoundSync();

  const [mobileTab, setMobileTab] = useState<'patients' | 'summary' | 'photos' | 'table'>('patients');
  const [desktopTab, setDesktopTab] = useState<'summary' | 'photos' | 'table'>('summary');
  const [showNewWoundModal, setShowNewWoundModal] = useState(false);
  const [showComparatorModal, setShowComparatorModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const applyLayout = (matches: boolean) => setIsDesktopLayout(matches);

    applyLayout(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyLayout(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );

  useEffect(() => {
    if (!selectedWoundId) {
      setDraft(null);
      return;
    }

    void (async () => {
      const restored = await restoreDraft(selectedWoundId);
      setDraft(restored);
    })();
  }, [restoreDraft, selectedWoundId]);

  const handleNewWoundSubmit = async (payload: {
    caseInput: Parameters<typeof createCase>[0];
    initialEntry?: {
      measure_length_cm?: number | null;
      measure_width_cm?: number | null;
      measure_depth_cm?: number | null;
      bed_aspect?: string[];
      edges?: string[];
      observations?: string | null;
    };
    initialPhotos: File[];
  }) => {
    const createdCase = await createCase(payload.caseInput);

    if (!createdCase) {
      setShowNewWoundModal(false);
      return;
    }

    if (payload.initialEntry || payload.initialPhotos.length > 0) {
      await createEntryWithPhotos(
        {
          wound_id: createdCase.id,
          ...payload.initialEntry,
        },
        payload.initialPhotos,
      );
    }

    await refreshWounds(payload.caseInput.patient_id);
    setShowNewWoundModal(false);
  };


  const handleDraftChange = useCallback(async (nextDraft: Record<string, unknown>) => {
    if (!selectedWoundId) return;
    setDraft((prev) => (prev === nextDraft ? prev : nextDraft));
    await persistDraft(selectedWoundId, nextDraft);
  }, [persistDraft, selectedWoundId]);

  const handleDraftClear = useCallback(async () => {
    if (!selectedWoundId) return;
    setDraft(null);
    await clearDraft(selectedWoundId);
  }, [clearDraft, selectedWoundId]);

  const handleCloseSubmit = async (payload: {
    closure_type: 'alta' | 'autocuidado' | 'ubs';
    closure_date: string;
    closure_reason: string;
    finalPhoto: File | null;
  }) => {
    if (!selectedWound) return;

    const closeResult = await closeCase({
      wound_id: selectedWound.id,
      expected_version: selectedWound.version,
      closure_type: payload.closure_type,
      closure_date: payload.closure_date,
      closure_reason: payload.closure_reason,
    });

    if (payload.finalPhoto) {
      if (closeResult) {
        await createEntryWithPhotos(
          {
            wound_id: selectedWound.id,
            observations: 'Foto final de encerramento.',
          },
          [payload.finalPhoto],
        );
      } else {
        const blobId = createOfflineId('wound-photo');

        await saveWoundPhotoBlob({
          id: blobId,
          wound_id: selectedWound.id,
          fileName: payload.finalPhoto.name,
          mimeType: payload.finalPhoto.type,
          blob: payload.finalPhoto,
          createdAt: Date.now(),
        });

        await queueWoundMutation(
          'upload_photo',
          {
            wound_id: selectedWound.id,
            photo_blob_id: blobId,
            file_name: payload.finalPhoto.name,
            mime_type: payload.finalPhoto.type,
            description: 'Foto final de encerramento.',
            is_primary: true,
          },
          selectedWound.id,
        );
      }
    }
  };

  const handleReopenSubmit = async (payload: { reason: string }) => {
    if (!selectedWound) return;

    await reopenCase({
      wound_id: selectedWound.id,
      expected_version: selectedWound.version,
      reason: payload.reason,
    });
  };

  const handleGenerateUbsDocument = () => {
    if (!selectedWound || !selectedPatient) return;

    const latestEntry = [...entries].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    )[0];

    navigate('/documents', {
      state: {
        documentPreset: {
          templateId: 'referencia_ubs_curativo',
          values: {
            NOME_PACIENTE: selectedPatient.full_name,
            CNS_CPF: selectedPatient.document_value,
            LOCALIZACAO_LESAO: selectedWound.anatomical_code,
            DATA_INICIO_LESAO: selectedWound.started_at,
            CLASSIFICACAO_LESAO: selectedWound.classification || '',
            TIPO_FECHAMENTO: selectedWound.closure_type || 'ubs',
            DATA_FECHAMENTO: selectedWound.closure_date || '',
            MOTIVO_ENCERRAMENTO: selectedWound.closure_reason || '',
            ULTIMA_MEDIDA: latestEntry
              ? `${latestEntry.measure_length_cm ?? '-'} x ${latestEntry.measure_width_cm ?? '-'} x ${latestEntry.measure_depth_cm ?? '-'} cm`
              : '',
            ULTIMA_COBERTURA: latestEntry?.dressing_type || '',
            ULTIMA_OBSERVACAO: latestEntry?.observations || '',
            ORIENTACOES_UBS: 'Manter acompanhamento na UBS com troca de curativo conforme avaliação clínica.',
          },
        },
      },
    });
  };

  const selectedCodes = wounds.map((wound) => wound.anatomical_code);

  return (
    <div className="flex w-full flex-col gap-4 pb-4 lg:h-full lg:overflow-hidden lg:pb-0">
      <header className="rounded-2xl border border-border bg-card p-4 lg:rounded-none lg:border-0 lg:border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Curativos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fluxo simplificado para cadastro de feridas, evolução clínica, fotos e sincronização offline.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 px-4">
        <WoundSyncIndicator
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={summary.pendingCount}
          conflictCount={summary.conflictCount}
          onSyncNow={() => {
            void syncNow();
          }}
          className="xl:hidden"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setShowNewWoundModal(true)}
            disabled={!selectedPatientId}
          >
            Nova ferida
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
            disabled={!selectedWoundId}
          >
            Nova evolução
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setMobileTab('photos');
              setDesktopTab('photos');
            }}
            disabled={!selectedWoundId}
            className="text-muted-foreground"
          >
            Ver fotos
          </Button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Existem conflitos de sincronização pendentes ({conflicts.length}). Revise antes de fechar/reabrir novas feridas.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isDesktopLayout ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-4 overflow-hidden">
            <aside className="col-span-4 space-y-4 overflow-y-auto pb-2 pr-1">
              <WoundPatientList
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onCreatePatient={createPatient}
              />
              <WoundCaseList
                wounds={wounds}
                selectedWoundId={selectedWoundId}
                onSelectWound={setSelectedWoundId}
                onNewWound={() => setShowNewWoundModal(true)}
              />
            </aside>

            <main className="col-span-8 space-y-4 overflow-y-auto pb-2 pr-1">
              <WoundCaseHeader
                wound={selectedWound}
                onCloseCase={() => setShowCloseModal(true)}
                onReopenCase={() => setShowReopenModal(true)}
                onGenerateUbsDocument={handleGenerateUbsDocument}
              />

              <Tabs
                value={desktopTab}
                onValueChange={(value) => setDesktopTab(value as 'summary' | 'photos' | 'table')}
                className="space-y-3"
              >
                <TabsList>
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                  <TabsTrigger value="photos">Fotos</TabsTrigger>
                  <TabsTrigger value="table">Tabela</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <BodyDiagram value={selectedWound?.anatomical_code} selectedCodes={selectedCodes} disabled />
                  <WoundTimeline entries={entries} />
                </TabsContent>

                <TabsContent value="photos" className="space-y-4">
                  <WoundGallery photos={photos} onDeletePhoto={removePhoto} />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowComparatorModal(true)}
                    disabled={photos.length < 2}
                  >
                    Comparar fotos
                  </Button>
                </TabsContent>

                <TabsContent value="table">
                  <WoundEvolutionTable entries={entries} />
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      ) : (
        <div>
          <Tabs
            value={mobileTab}
            onValueChange={(value) => setMobileTab(value as 'patients' | 'summary' | 'photos' | 'table')}
            className="space-y-4"
          >
            <TabsList className="w-full justify-between">
              <TabsTrigger value="patients" className="flex-1">Pacientes</TabsTrigger>
              <TabsTrigger value="summary" className="flex-1">Resumo</TabsTrigger>
              <TabsTrigger value="photos" className="flex-1">Fotos</TabsTrigger>
              <TabsTrigger value="table" className="flex-1">Tabela</TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="space-y-3">
              <WoundPatientList
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onCreatePatient={createPatient}
              />
              <WoundCaseList
                wounds={wounds}
                selectedWoundId={selectedWoundId}
                onSelectWound={setSelectedWoundId}
                onNewWound={() => setShowNewWoundModal(true)}
              />
            </TabsContent>

            <TabsContent value="summary" className="space-y-3">
              <WoundCaseHeader
                wound={selectedWound}
                onCloseCase={() => setShowCloseModal(true)}
                onReopenCase={() => setShowReopenModal(true)}
                onGenerateUbsDocument={handleGenerateUbsDocument}
              />
              <BodyDiagram value={selectedWound?.anatomical_code} selectedCodes={selectedCodes} disabled />
              <WoundTimeline entries={entries} />
            </TabsContent>

            <TabsContent value="photos" className="space-y-3">
              <WoundGallery photos={photos} onDeletePhoto={removePhoto} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowComparatorModal(true)}
                disabled={photos.length < 2}
              >
                Comparar fotos
              </Button>
            </TabsContent>

            <TabsContent value="table">
              <WoundEvolutionTable entries={entries} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Modal
        isOpen={showNewWoundModal}
        onClose={() => setShowNewWoundModal(false)}
        panelClassName="max-h-[90vh] max-w-4xl overflow-y-auto p-4 sm:p-5"
      >
        <NewWoundForm
          patientId={selectedPatientId}
          existingAnatomicalCodes={selectedCodes}
          onSubmit={handleNewWoundSubmit}
          onCancel={() => setShowNewWoundModal(false)}
        />
      </Modal>


      <Modal
        isOpen={showComparatorModal}
        onClose={() => setShowComparatorModal(false)}
        panelClassName="max-h-[90vh] max-w-5xl overflow-y-auto p-4 sm:p-5"
      >
        <WoundPhotoComparator photos={photos} />
      </Modal>

      <WoundCloseModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onSubmit={handleCloseSubmit}
      />

      <WoundReopenModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        onSubmit={handleReopenSubmit}
      />

      {loading && <p className="text-xs text-muted-foreground">Carregando dados de curativos...</p>}
    </div>
  );
};

export default WoundsPage;

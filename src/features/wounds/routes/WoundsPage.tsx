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
import WoundEmptyState from '../components/WoundEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
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
    removePatient,
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
  const [desktopTab, setDesktopTab] = useState<'summary' | 'photos'>('summary');
  const [showNewWoundModal, setShowNewWoundModal] = useState(false);
  const [showComparatorModal, setShowComparatorModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
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

  const handleDesktopTabChange = (value: string) => {
    if (value === 'table') {
      if (!selectedWoundId) return;
      setShowTableModal(true);
      return;
    }

    setDesktopTab(value as 'summary' | 'photos');
  };

  const handleMobileTabChange = (value: string) => {
    if (value === 'table') {
      if (!selectedWoundId) {
        setMobileTab('patients');
        return;
      }

      navigate(`/wounds/table/${selectedWoundId}`);
      return;
    }

    setMobileTab(value as 'patients' | 'summary' | 'photos' | 'table');
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-4 lg:h-full lg:overflow-hidden lg:pb-0">
      <header className="rounded-2xl border border-border bg-card p-4 lg:rounded-none lg:border-0 lg:border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Curativos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fluxo simplificado para cadastro de feridas, evolução clínica, fotos e sincronização offline.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 px-4 xl:hidden">
        <WoundSyncIndicator
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={summary.pendingCount}
          conflictCount={summary.conflictCount}
          onSyncNow={() => {
            void syncNow();
          }}
        />
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
        <div className="min-h-0 flex-1">
          <div className="grid h-full min-h-0 grid-cols-12 gap-4">
            <aside className="col-span-3 h-full overflow-y-auto pb-6 pr-1 custom-scrollbar">
              <WoundPatientList
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onCreatePatient={createPatient}
                onDeletePatient={removePatient}
              />
            </aside>

            <aside className="col-span-3 h-full overflow-y-auto pb-6 pr-1 custom-scrollbar">
              <WoundCaseList
                wounds={wounds}
                selectedWoundId={selectedWoundId}
                onSelectWound={setSelectedWoundId}
                onNewWound={() => setShowNewWoundModal(true)}
                onNewEvolution={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
              />
            </aside>

            <main className="col-span-6 h-full overflow-y-auto pb-6 pr-1 custom-scrollbar">
              <AnimatePresence mode="wait">
                {!selectedPatientId ? (
                  <motion.div
                    key="no-patient"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WoundEmptyState type="selection" />
                  </motion.div>
                ) : !selectedWoundId ? (
                  <motion.div
                    key="no-wound"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WoundEmptyState type="wound" />
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedWoundId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <WoundCaseHeader
                      wound={selectedWound}
                      onCloseCase={() => setShowCloseModal(true)}
                      onReopenCase={() => setShowReopenModal(true)}
                      onGenerateUbsDocument={handleGenerateUbsDocument}
                    />

                    <Tabs
                      value={desktopTab}
                      onValueChange={handleDesktopTabChange}
                      className="space-y-3"
                    >
                      <TabsList className="bg-background/40 backdrop-blur-sm border border-border/40 p-1 rounded-2xl">
                        <TabsTrigger value="summary" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Resumo</TabsTrigger>
                        <TabsTrigger value="photos" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Fotos</TabsTrigger>
                        <TabsTrigger value="table" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Tabela</TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-4 outline-none">
                        <BodyDiagram value={selectedWound?.anatomical_code} selectedCodes={selectedCodes} disabled />
                        <WoundTimeline entries={entries} photos={photos} />
                      </TabsContent>

                      <TabsContent value="photos" className="space-y-4 outline-none">
                        <WoundGallery photos={photos} onDeletePhoto={removePhoto} />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowComparatorModal(true)}
                          disabled={photos.length < 2}
                          className="w-full h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-secondary/50 hover:bg-secondary transition-all"
                        >
                          Comparar fotos evolutivas
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      ) : (
        <div>
          <Tabs
            value={mobileTab}
            onValueChange={handleMobileTabChange}
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
                onDeletePatient={removePatient}
              />
              <WoundCaseList
                wounds={wounds}
                selectedWoundId={selectedWoundId}
                onSelectWound={setSelectedWoundId}
                onNewWound={() => setShowNewWoundModal(true)}
                onNewEvolution={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
              />
            </TabsContent>

            <TabsContent value="summary" className="space-y-3 outline-none">
              <AnimatePresence mode="wait">
                {!selectedWound ? (
                  <WoundEmptyState type="wound" />
                ) : (
                  <motion.div
                    key={selectedWoundId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <WoundCaseHeader
                      wound={selectedWound}
                      onCloseCase={() => setShowCloseModal(true)}
                      onReopenCase={() => setShowReopenModal(true)}
                      onGenerateUbsDocument={handleGenerateUbsDocument}
                    />
                    <BodyDiagram value={selectedWound?.anatomical_code} selectedCodes={selectedCodes} disabled />
                    <WoundTimeline entries={entries} photos={photos} />
                  </motion.div>
                )}
              </AnimatePresence>
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

      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        panelClassName="max-h-[92vh] max-w-[96vw] overflow-y-auto p-4 sm:p-5"
      >
        <WoundEvolutionTable
          entries={entries}
          mode="modal"
          patient={selectedPatient}
          wound={selectedWound}
        />
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

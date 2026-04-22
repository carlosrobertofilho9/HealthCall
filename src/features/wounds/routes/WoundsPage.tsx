import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, MobileStickyTabs, Tabs, TabsContent, TabsList, TabsTrigger, SectionCard } from '@/components/ui';
import { PageShell } from '@/components/layout';
import { Users, PlusCircle, Plus, Camera, Bandage, Stethoscope, Activity, TableProperties, Table, UserPlus } from 'lucide-react';
import WoundPatientList from '../components/WoundPatientList';
import WoundCaseList from '../components/WoundCaseList';
import WoundCaseHeader from '../components/WoundCaseHeader';
import NewWoundForm from '../components/NewWoundForm';
import WoundTimeline from '../components/WoundTimeline';
import WoundGallery from '../components/WoundGallery';
import WoundPhotoComparator from '../components/WoundPhotoComparator';
import WoundEvolutionTable from '../components/WoundEvolutionTable';
import WoundSummaryDashboard from '../components/WoundSummaryDashboard';
import WoundEvolutionForm from '../components/WoundEvolutionForm';
import WoundCloseModal from '../components/WoundCloseModal';
import WoundReopenModal from '../components/WoundReopenModal';
import WoundSyncIndicator from '../components/WoundSyncIndicator';
import WoundEmptyState from '../components/WoundEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { useWounds } from '../hooks/useWounds';
import { useWoundSync } from '../hooks/useWoundSync';
import { createOfflineId, saveWoundPhotoBlob } from '../services/woundOfflineStore';
import { queueWoundMutation } from '../services/woundSyncService';
import type { WoundEntry } from '../types';

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
    updatePatient,
    updateCase,
    updateEntry,
    removeEntry,
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
  const [showEditWoundModal, setShowEditWoundModal] = useState(false);
  const [showComparatorModal, setShowComparatorModal] = useState(false);
  const [showWoundSelectorSheet, setShowWoundSelectorSheet] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WoundEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<WoundEntry | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
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

  const handleEditWoundSubmit = async (payload: {
    caseInput: Parameters<typeof createCase>[0];
  }) => {
    if (!selectedWoundId) return;
    await updateCase(selectedWoundId, payload.caseInput);
    setShowEditWoundModal(false);
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

  const handleEditEntrySubmit = async (input: Parameters<typeof updateEntry>[1]) => {
    if (!editingEntry || !selectedWoundId) return;
    await updateEntry(editingEntry.id, input, selectedWoundId);
    setShowEditEntryModal(false);
    setEditingEntry(null);
  };

  const handleDeleteEntryConfirm = async () => {
    if (!deletingEntry || !selectedWoundId) return;
    await removeEntry(deletingEntry.id, selectedWoundId);
    setShowDeleteEntryModal(false);
    setDeletingEntry(null);
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

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowWoundSelectorSheet(true);
  };

  const handleWoundSelect = (woundId: string) => {
    setSelectedWoundId(woundId);
    setShowWoundSelectorSheet(false);

    if (!isDesktopLayout) {
      setMobileTab('summary');
    }
  };

  return (
    <PageShell className="flex flex-col xl:h-full xl:overflow-hidden">
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
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex w-80 flex-col border-r border-border bg-background">
          <SectionCard 
            title="Pacientes" 
            icon={<Users size={18} />}
            headerActions={
              <div className="group relative">
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  onClick={() => setShowPatientForm(prev => !prev)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 -translate-y-1 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-popover-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  Novo Paciente
                </div>
              </div>
            }
          >
            <div className="p-4 flex flex-col gap-4 h-full overflow-hidden">
              <WoundPatientList
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onCreatePatient={createPatient}
                onUpdatePatient={updatePatient}
                onDeletePatient={removePatient}
                showForm={showPatientForm}
                onToggleForm={() => setShowPatientForm(prev => !prev)}
              />
            </div>
          </SectionCard>
        </div>

        <div className="flex w-95 flex-col border-r border-border bg-background">
          <SectionCard 
            title="Feridas" 
            icon={<Bandage size={18} />}
            headerActions={
              <div className="flex items-center gap-1">
                <div className="group relative">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowNewWoundModal(true)}
                    disabled={!selectedPatientId}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 -translate-y-1 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-popover-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    Nova Ferida
                  </div>
                </div>

                <div className="group relative">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
                    disabled={!selectedWoundId}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                  </Button>
                  <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 -translate-y-1 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-popover-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    Nova Evolução
                  </div>
                </div>
              </div>
            }
          >
            <div className="p-4 h-full overflow-hidden">
              <WoundCaseList
                wounds={wounds}
                selectedWoundId={selectedWoundId}
                onSelectWound={setSelectedWoundId}
                onNewWound={() => setShowNewWoundModal(true)}
                onNewEvolution={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
              />
            </div>
          </SectionCard>
        </div>

        <main className="flex min-w-0 flex-1 flex-col bg-background">
          <SectionCard 
            title={selectedWoundId ? `Detalhes: ${selectedWound?.anatomical_code}` : 'Acompanhamento'} 
            icon={<Stethoscope size={18} />}
            headerActions={
              <div className="flex items-center gap-2">
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
            }
          >
            <div className="flex-1 custom-scrollbar overflow-y-auto p-4 lg:p-6">
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
                    className="space-y-6"
                  >
                    <WoundCaseHeader
                      wound={selectedWound}
                      onEditCase={() => setShowEditWoundModal(true)}
                      onCloseCase={() => setShowCloseModal(true)}
                      onReopenCase={() => setShowReopenModal(true)}
                    />

                    <Tabs
                      value={desktopTab}
                      onValueChange={handleDesktopTabChange}
                      className="space-y-4"
                    >
                      <TabsList className="bg-background/40 backdrop-blur-sm border border-border/40 p-1 rounded-2xl w-fit">
                        <TabsTrigger value="summary" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                          <Activity className="mr-2 h-3.5 w-3.5" />
                          Resumo
                        </TabsTrigger>
                        <TabsTrigger value="photos" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                          <Camera className="mr-2 h-3.5 w-3.5" />
                          Fotos
                        </TabsTrigger>
                        <TabsTrigger value="table" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                          <TableProperties className="mr-2 h-3.5 w-3.5" />
                          Tabela
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-6 outline-none">
                        <WoundSummaryDashboard
                          entries={entries}
                          photos={photos}
                          wound={selectedWound}
                          relatedAnatomicalCodes={selectedCodes}
                        />
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
            </div>
          </SectionCard>
        </main>
      </div>
      ) : (
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-28 xl:hidden">
          <Tabs
            value={mobileTab}
            onValueChange={handleMobileTabChange}
            className="min-w-0"
          >
            <MobileStickyTabs
              value={mobileTab}
              onValueChange={handleMobileTabChange}
              ariaLabel="Navegação de curativos"
              items={[
                {
                  value: 'patients',
                  label: 'Pacientes',
                  icon: <Users className="h-4 w-4" />,
                },
                {
                  value: 'summary',
                  label: 'Resumo',
                  icon: <Activity className="h-4 w-4" />,
                  disabled: !selectedWoundId,
                },
                {
                  value: 'photos',
                  label: 'Fotos',
                  icon: <Camera className="h-4 w-4" />,
                  disabled: !selectedWoundId,
                  badge: photos.length || undefined,
                },
                {
                  value: 'table',
                  label: 'Tabela',
                  icon: <Table className="h-4 w-4" />,
                  disabled: !selectedWoundId,
                },
              ]}
            />

            <div className="min-w-0 space-y-3 px-4 pt-3">
              <WoundSyncIndicator
                className="w-full justify-between"
                isOnline={isOnline}
                isSyncing={isSyncing}
                pendingCount={summary.pendingCount}
                conflictCount={summary.conflictCount}
                onSyncNow={() => {
                  void syncNow();
                }}
              />

              <TabsContent value="patients" className="space-y-3">
                <WoundPatientList
                  patients={patients}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={handlePatientSelect}
                  onCreatePatient={createPatient}
                  onUpdatePatient={updatePatient}
                  onDeletePatient={removePatient}
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
                        onEditCase={() => setShowEditWoundModal(true)}
                        onCloseCase={() => setShowCloseModal(true)}
                        onReopenCase={() => setShowReopenModal(true)}
                      />
                      <WoundSummaryDashboard
                        entries={entries}
                        photos={photos}
                        wound={selectedWound}
                        relatedAnatomicalCodes={selectedCodes}
                      />
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
            </div>
          </Tabs>

          <div className="app-keyboard-compact-hide fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 backdrop-blur transition-all duration-200 xl:hidden">
            <Button
              type="button"
              size="sm"
              onClick={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
              disabled={!selectedWoundId}
              className="h-11 w-full rounded-2xl text-sm font-black uppercase tracking-wide"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova evolução
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showWoundSelectorSheet}
        onClose={() => setShowWoundSelectorSheet(false)}
        position="bottom"
        showMobileHandle
        panelClassName="max-h-[88vh] overflow-y-auto p-4 sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl sm:p-5"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Selecionar lesão</h3>
            <p className="text-xs text-muted-foreground">
              {selectedPatient
                ? `Paciente: ${selectedPatient.full_name}`
                : 'Selecione um paciente para escolher uma lesão.'}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setShowWoundSelectorSheet(false);
              setShowNewWoundModal(true);
            }}
            disabled={!selectedPatientId}
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Nova lesão
          </Button>

          <div className="h-[58vh] max-h-135">
            <WoundCaseList
              wounds={wounds}
              selectedWoundId={selectedWoundId}
              onSelectWound={handleWoundSelect}
              onNewWound={() => setShowNewWoundModal(true)}
              onNewEvolution={() => navigate(`/wounds/evolution/${selectedWoundId}`)}
            />
          </div>
        </div>
      </Modal>

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
        isOpen={showEditWoundModal}
        onClose={() => setShowEditWoundModal(false)}
        panelClassName="max-h-[90vh] max-w-4xl overflow-y-auto p-4 sm:p-5"
      >
        <NewWoundForm
          patientId={selectedPatientId}
          initialWound={selectedWound}
          existingAnatomicalCodes={selectedCodes}
          onSubmit={handleEditWoundSubmit}
          onCancel={() => setShowEditWoundModal(false)}
        />
      </Modal>


      <Modal
        isOpen={showComparatorModal}
        onClose={() => setShowComparatorModal(false)}
        panelClassName="max-h-[94vh] max-w-[96vw] overflow-y-auto p-3 sm:max-w-6xl sm:p-5"
      >
        <WoundPhotoComparator
          photos={photos}
          onClose={() => setShowComparatorModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        panelClassName="max-h-[92vh] max-w-[96vw] overflow-y-auto p-4 sm:p-5"
      >
        <WoundEvolutionTable
          entries={entries}
          photos={photos}
          mode="modal"
          patient={selectedPatient}
          wound={selectedWound}
          onEditEntry={(entry) => {
            setEditingEntry(entry);
            setShowEditEntryModal(true);
          }}
          onDeleteEntry={(entry) => {
            setDeletingEntry(entry);
            setShowDeleteEntryModal(true);
          }}
        />
      </Modal>

      <Modal
        isOpen={showEditEntryModal}
        onClose={() => setShowEditEntryModal(false)}
        panelClassName="max-h-[90vh] max-w-4xl overflow-y-auto p-4 sm:p-5"
      >
        <WoundEvolutionForm
          woundId={selectedWoundId}
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
    </PageShell>
  );
};

export default WoundsPage;

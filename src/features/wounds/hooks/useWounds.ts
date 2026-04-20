import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  addWoundEntry,
  closeWoundCase,
  createWoundCase,
  createWoundPatient,
  deleteWoundPatient,
  deleteWoundPhoto,
  hydratePhotosWithSignedUrls,
  listPatientsWithTrackedWounds,
  listWoundEntries,
  listWoundPhotos,
  listWoundStatusEvents,
  listWoundsByPatient,
  reopenWoundCase,
  uploadWoundPhotos,
} from '../services/woundService';
import {
  createOfflineId,
  deleteWoundPhotoMetadataCache,
  deleteWoundDraft,
  getWoundDraft,
  saveWoundDraft,
  saveWoundPhotoBlob,
} from '../services/woundOfflineStore';
import { queueWoundMutation } from '../services/woundSyncService';
import { deleteWoundPhotoMetadataFromMemoryCache } from '../services/woundPhotoMetadataService';
import type {
  CloseWoundCaseInput,
  CreateWoundCaseInput,
  CreateWoundEntryInput,
  CreateWoundPatientInput,
  ReopenWoundCaseInput,
  UploadWoundPhotoInput,
  WoundCase,
  WoundEntry,
  WoundPatientWithSummary,
  WoundPhoto,
  WoundStatusEvent,
} from '../types';

interface WoundFormDraft {
  [key: string]: unknown;
}

function isOfflineError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error ?? '');
  const normalized = text.toLowerCase();
  return normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('offline');
}

export function useWounds() {
  const [patients, setPatients] = useState<WoundPatientWithSummary[]>([]);
  const [wounds, setWounds] = useState<WoundCase[]>([]);
  const [entries, setEntries] = useState<WoundEntry[]>([]);
  const [photos, setPhotos] = useState<WoundPhoto[]>([]);
  const [events, setEvents] = useState<WoundStatusEvent[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedWoundId, setSelectedWoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedWound = useMemo(
    () => wounds.find((item) => item.id === selectedWoundId) ?? null,
    [selectedWoundId, wounds],
  );

  const refreshPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listPatientsWithTrackedWounds({ includeClosed: true });
      setPatients(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar pacientes com feridas.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWounds = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await listWoundsByPatient(patientId, 'all');
      setWounds(data);
      if (!data.find((item) => item.id === selectedWoundId)) {
        setSelectedWoundId(data[0]?.id ?? null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar feridas do paciente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedWoundId]);

  const refreshWoundDetails = useCallback(async (woundId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [entryRows, photoRows, statusRows] = await Promise.all([
        listWoundEntries(woundId),
        listWoundPhotos(woundId),
        listWoundStatusEvents(woundId),
      ]);

      setEntries(entryRows);
      setPhotos(await hydratePhotosWithSignedUrls(photoRows));
      setEvents(statusRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes da ferida.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPatients();
  }, [refreshPatients]);

  useEffect(() => {
    if (!selectedPatientId) {
      setWounds([]);
      setSelectedWoundId(null);
      return;
    }

    void refreshWounds(selectedPatientId);
  }, [refreshWounds, selectedPatientId]);

  useEffect(() => {
    if (!selectedWoundId) {
      setEntries([]);
      setPhotos([]);
      setEvents([]);
      return;
    }

    void refreshWoundDetails(selectedWoundId);
  }, [refreshWoundDetails, selectedWoundId]);

  const createPatient = useCallback(async (input: CreateWoundPatientInput) => {
    try {
      const created = await createWoundPatient(input);
      toast.success('Paciente clínico cadastrado com sucesso.');
      await refreshPatients();
      setSelectedPatientId(created.id);
      return created;
    } catch (err) {
      if (isOfflineError(err)) {
        await queueWoundMutation('create_patient', input);
        toast.info('Paciente salvo offline e será sincronizado automaticamente.');
        return null;
      }

      const message = err instanceof Error ? err.message : 'Falha ao cadastrar paciente.';
      toast.error(message);
      throw err;
    }
  }, [refreshPatients]);

  const createCase = useCallback(async (input: CreateWoundCaseInput) => {
    try {
      const created = await createWoundCase(input);
      toast.success('Ferida cadastrada com sucesso.');
      await refreshWounds(input.patient_id);
      setSelectedWoundId(created.id);
      return created;
    } catch (err) {
      if (isOfflineError(err)) {
        await queueWoundMutation('create_wound', input, undefined);
        toast.info('Ferida registrada offline e ficará pendente de sincronização.');
        return null;
      }

      const message = err instanceof Error ? err.message : 'Falha ao criar ferida.';
      toast.error(message);
      throw err;
    }
  }, [refreshWounds]);

  const createEntry = useCallback(async (input: CreateWoundEntryInput) => {
    try {
      const created = await addWoundEntry(input);
      toast.success('Evolução registrada com sucesso.');
      await refreshWoundDetails(input.wound_id);
      return created;
    } catch (err) {
      if (isOfflineError(err)) {
        await queueWoundMutation('add_entry', input, input.wound_id);
        toast.info('Evolução salva offline. Será sincronizada quando houver conexão.');
        return null;
      }

      const message = err instanceof Error ? err.message : 'Falha ao registrar evolução.';
      toast.error(message);
      throw err;
    }
  }, [refreshWoundDetails]);

  const createEntryWithPhotos = useCallback(async (
    input: CreateWoundEntryInput,
    imageFiles: File[],
  ) => {
    const createdEntry = await createEntry(input);

    if (!imageFiles.length) {
      return createdEntry;
    }

    if (createdEntry) {
      const uploads: UploadWoundPhotoInput[] = imageFiles.map((file, index) => ({
        wound_id: input.wound_id,
        entry_id: createdEntry.id,
        file,
        display_order: index,
        is_primary: index === 0,
      }));

      try {
        await uploadWoundPhotos(uploads);
        await refreshWoundDetails(input.wound_id);
        toast.success('Fotos da evolução enviadas com sucesso.');
      } catch (err) {
        if (!isOfflineError(err)) {
          const message = err instanceof Error ? err.message : 'Falha ao enviar fotos da evolução.';
          toast.error(message);
          throw err;
        }

        for (let index = 0; index < imageFiles.length; index += 1) {
          const file = imageFiles[index];
          const blobId = createOfflineId('wound-photo');

          await saveWoundPhotoBlob({
            id: blobId,
            wound_id: input.wound_id,
            fileName: file.name,
            mimeType: file.type,
            blob: file,
            createdAt: Date.now(),
          });

          await queueWoundMutation(
            'upload_photo',
            {
              wound_id: input.wound_id,
              entry_id: createdEntry.id,
              photo_blob_id: blobId,
              file_name: file.name,
              mime_type: file.type,
              display_order: index,
              is_primary: index === 0,
            },
            input.wound_id,
          );
        }

        toast.info('Fotos enfileiradas para sincronização offline.');
      }

      return createdEntry;
    }

    for (let index = 0; index < imageFiles.length; index += 1) {
      const file = imageFiles[index];
      const blobId = createOfflineId('wound-photo');

      await saveWoundPhotoBlob({
        id: blobId,
        wound_id: input.wound_id,
        fileName: file.name,
        mimeType: file.type,
        blob: file,
        createdAt: Date.now(),
      });

      await queueWoundMutation(
        'upload_photo',
        {
          wound_id: input.wound_id,
          photo_blob_id: blobId,
          file_name: file.name,
          mime_type: file.type,
          display_order: index,
          is_primary: index === 0,
        },
        input.wound_id,
      );
    }

    return null;
  }, [createEntry, refreshWoundDetails]);

  const closeCase = useCallback(async (input: CloseWoundCaseInput) => {
    try {
      const closed = await closeWoundCase(input);
      toast.success('Ferida encerrada com sucesso.');
      if (selectedPatientId) {
        await refreshWounds(selectedPatientId);
      }
      await refreshWoundDetails(input.wound_id);
      return closed;
    } catch (err) {
      if (isOfflineError(err)) {
        await queueWoundMutation('close_wound', input, input.wound_id);
        toast.info('Encerramento registrado offline e pendente de sincronização.');
        return null;
      }

      const message = err instanceof Error ? err.message : 'Falha ao encerrar ferida.';
      toast.error(message);
      throw err;
    }
  }, [refreshWoundDetails, refreshWounds, selectedPatientId]);

  const reopenCase = useCallback(async (input: ReopenWoundCaseInput) => {
    try {
      const reopened = await reopenWoundCase(input);
      toast.success('Ferida reaberta com sucesso.');
      if (selectedPatientId) {
        await refreshWounds(selectedPatientId);
      }
      await refreshWoundDetails(input.wound_id);
      return reopened;
    } catch (err) {
      if (isOfflineError(err)) {
        await queueWoundMutation('reopen_wound', input, input.wound_id);
        toast.info('Reabertura salva offline e pendente de sincronização.');
        return null;
      }

      const message = err instanceof Error ? err.message : 'Falha ao reabrir ferida.';
      toast.error(message);
      throw err;
    }
  }, [refreshWoundDetails, refreshWounds, selectedPatientId]);

  const removePhoto = useCallback(async (photoId: string) => {
    const currentWoundId = selectedWoundId;
    if (!currentWoundId) return;

    try {
      await deleteWoundPhoto(photoId);
      deleteWoundPhotoMetadataFromMemoryCache(photoId);
      await deleteWoundPhotoMetadataCache(photoId).catch(() => undefined);
      toast.success('Foto removida com sucesso.');
      await refreshWoundDetails(currentWoundId);
    } catch (err) {
      if (isOfflineError(err)) {
        await queueWoundMutation('delete_photo', { photo_id: photoId }, currentWoundId);
        toast.info('Remoção de foto pendente para sincronização.');
        return;
      }

      const message = err instanceof Error ? err.message : 'Falha ao remover foto.';
      toast.error(message);
      throw err;
    }
  }, [refreshWoundDetails, selectedWoundId]);
 
  const removePatient = useCallback(async (patientId: string) => {
    try {
      await deleteWoundPatient(patientId);
      toast.success('Paciente e todos os dados relacionados foram excluídos.');
      
      if (selectedPatientId === patientId) {
        setSelectedPatientId(null);
        setSelectedWoundId(null);
      }
      
      await refreshPatients();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao excluir paciente.';
      toast.error(message);
      throw err;
    }
  }, [refreshPatients, selectedPatientId]);

  const persistDraft = useCallback(async (woundId: string, form: WoundFormDraft) => {
    await saveWoundDraft(woundId, form);
  }, []);

  const restoreDraft = useCallback(async (woundId: string) => {
    const draft = await getWoundDraft(woundId);
    return (draft?.form ?? null) as WoundFormDraft | null;
  }, []);

  const clearDraft = useCallback(async (woundId: string) => {
    await deleteWoundDraft(woundId);
  }, []);

  return {
    patients,
    wounds,
    entries,
    photos,
    events,
    selectedWound,
    selectedPatientId,
    selectedWoundId,
    loading,
    error,
    setSelectedPatientId,
    setSelectedWoundId,
    refreshPatients,
    refreshWounds,
    refreshWoundDetails,
    createPatient,
    createCase,
    createEntry,
    createEntryWithPhotos,
    closeCase,
    reopenCase,
    removePhoto,
    removePatient,
    persistDraft,
    restoreDraft,
    clearDraft,
  };
}

export default useWounds;

import type {
  CloseWoundCaseInput,
  CreateWoundCaseInput,
  CreateWoundEntryInput,
  CreateWoundPatientInput,
  ReopenWoundCaseInput,
  UploadWoundPhotoInput,
  WoundCase,
  WoundCaseStatus,
  WoundEntry,
  WoundPatient,
  WoundPatientWithSummary,
  WoundPhoto,
  WoundStatusEvent,
} from '../types';
import { apiRequest, deleteLocalMedia, uploadLocalMedia } from '@/lib/apiClient';
import { getWoundPhotoCache, saveWoundPhotoCache, deleteWoundPhotoCache } from './woundOfflineStore';
import { resizeAndCompressImage } from '@/lib/imageUtils';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const WEB_SAFE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function assertImageFile(file: File): void {
  if (!file.type.startsWith('image/')) throw new Error('Apenas imagens são permitidas para upload.');
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error('A imagem excede o limite de 5MB.');
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function normalizeCoordinates(latitude?: number | null, longitude?: number | null): { latitude: number; longitude: number } | null {
  if (
    typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
    typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180
  ) return null;
  return { latitude, longitude };
}

async function normalizeUploadImage(file: File): Promise<{ blob: Blob; contentType: string; extensionHint: string }> {
  const normalizedType = file.type.toLowerCase();
  if (WEB_SAFE_IMAGE_TYPES.has(normalizedType)) {
    return { blob: file, contentType: normalizedType, extensionHint: extensionFromMimeType(normalizedType) };
  }
  const converted = await resizeAndCompressImage(file);
  return { blob: converted, contentType: 'image/jpeg', extensionHint: 'jpg' };
}

function mediaUrl(storagePath: string): string {
  const [kind, ...rest] = storagePath.split('/');
  return `/api/media/${encodeURIComponent(kind)}/${encodeURIComponent(rest.join('/'))}`;
}

export async function listPatientsWithTrackedWounds(filters?: {
  search?: string;
  anatomicalCode?: string;
  includeClosed?: boolean;
}): Promise<WoundPatientWithSummary[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.anatomicalCode) params.set('anatomicalCode', filters.anatomicalCode);
  if (filters?.includeClosed) params.set('includeClosed', '1');
  return apiRequest<WoundPatientWithSummary[]>(`/api/wounds/patients?${params.toString()}`);
}

export async function createWoundPatient(input: CreateWoundPatientInput): Promise<WoundPatient> {
  if (!input.full_name.trim()) throw new Error('Nome do paciente é obrigatório.');
  if (!input.document_value.trim()) throw new Error('Documento do paciente é obrigatório.');
  return apiRequest<WoundPatient>('/api/wounds/patients', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateWoundPatient(patientId: string, input: Partial<CreateWoundPatientInput>): Promise<WoundPatient> {
  return apiRequest<WoundPatient>(`/api/wounds/patients/${encodeURIComponent(patientId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteWoundPatient(patientId: string): Promise<void> {
  await apiRequest<void>(`/api/wounds/patients/${encodeURIComponent(patientId)}`, { method: 'DELETE' });
}

export async function listWoundsByPatient(patientId: string, statusFilter: WoundCaseStatus | 'all' = 'all'): Promise<WoundCase[]> {
  const params = new URLSearchParams({ patientId, status: statusFilter });
  return apiRequest<WoundCase[]>(`/api/wounds/cases?${params.toString()}`);
}

export async function getWoundCaseContext(woundId: string): Promise<{
  wound: WoundCase;
  patient: Pick<WoundPatient, 'full_name' | 'document_type' | 'document_value'>;
}> {
  return apiRequest(`/api/wounds/cases/${encodeURIComponent(woundId)}`);
}

export async function createWoundCase(input: CreateWoundCaseInput): Promise<WoundCase> {
  if (!input.patient_id) throw new Error('Paciente da ferida é obrigatório.');
  if (!input.anatomical_code.trim()) throw new Error('Localização anatômica é obrigatória.');
  if (!input.started_at) throw new Error('Data de início da lesão é obrigatória.');
  if (!input.etiology.trim()) throw new Error('Etiologia é obrigatória.');
  return apiRequest<WoundCase>('/api/wounds/cases', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateWoundCase(woundId: string, input: Partial<CreateWoundCaseInput>): Promise<WoundCase> {
  return apiRequest<WoundCase>(`/api/wounds/cases/${encodeURIComponent(woundId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function addWoundEntry(input: CreateWoundEntryInput): Promise<WoundEntry> {
  if (!input.wound_id) throw new Error('Ferida é obrigatória para registrar evolução.');
  if (input.pain_scale != null && (input.pain_scale < 0 || input.pain_scale > 10)) {
    throw new Error('Escala de dor deve estar entre 0 e 10.');
  }
  return apiRequest<WoundEntry>('/api/wounds/entries', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateWoundEntry(entryId: string, input: Partial<CreateWoundEntryInput>): Promise<WoundEntry> {
  return apiRequest<WoundEntry>(`/api/wounds/entries/${encodeURIComponent(entryId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteWoundEntry(entryId: string): Promise<void> {
  await apiRequest<void>(`/api/wounds/entries/${encodeURIComponent(entryId)}`, { method: 'DELETE' });
}

export async function listWoundEntries(woundId: string): Promise<WoundEntry[]> {
  return apiRequest<WoundEntry[]>(`/api/wounds/entries?woundId=${encodeURIComponent(woundId)}`);
}

export async function closeWoundCase(input: CloseWoundCaseInput): Promise<WoundCase> {
  return apiRequest<WoundCase>(`/api/wounds/cases/${encodeURIComponent(input.wound_id)}/close`, {
    method: 'POST',
    body: JSON.stringify({
      expected_version: input.expected_version,
      closure_type: input.closure_type,
      closure_date: input.closure_date,
      closure_reason: input.closure_reason,
      closed_by: input.closed_by ?? null,
    }),
  });
}

export async function reopenWoundCase(input: ReopenWoundCaseInput): Promise<WoundCase> {
  return apiRequest<WoundCase>(`/api/wounds/cases/${encodeURIComponent(input.wound_id)}/reopen`, {
    method: 'POST',
    body: JSON.stringify({
      expected_version: input.expected_version,
      reason: input.reason,
      reopened_by: input.reopened_by ?? null,
    }),
  });
}

export async function uploadWoundPhotos(inputs: UploadWoundPhotoInput[]): Promise<WoundPhoto[]> {
  const uploaded: WoundPhoto[] = [];

  for (let index = 0; index < inputs.length; index += 1) {
    const item = inputs[index];
    assertImageFile(item.file);
    const prepared = await normalizeUploadImage(item.file);
    const coordinates = normalizeCoordinates(item.latitude, item.longitude);
    const baseName = item.file.name.replace(/\.[^.]+$/, '') || 'ferida';
    const fileName = `${baseName}.${prepared.extensionHint}`;
    const media = await uploadLocalMedia('wounds', prepared.blob, fileName);

    try {
      const photo = await apiRequest<WoundPhoto>('/api/wounds/photos', {
        method: 'POST',
        body: JSON.stringify({
          wound_id: item.wound_id,
          entry_id: item.entry_id ?? null,
          storage_path: media.storagePath,
          url: media.url,
          captured_at: item.captured_at ?? new Date().toISOString(),
          display_order: item.display_order ?? index,
          description: item.description ?? null,
          is_primary: item.is_primary ?? false,
          latitude: coordinates?.latitude ?? null,
          longitude: coordinates?.longitude ?? null,
          location_source: coordinates ? (item.location_source ?? null) : null,
          location_captured_at: coordinates ? (item.location_captured_at ?? item.captured_at ?? new Date().toISOString()) : null,
        }),
      });
      await saveWoundPhotoCache(photo.id, prepared.blob);
      uploaded.push(photo);
    } catch (error) {
      await deleteLocalMedia(media.storagePath).catch(() => undefined);
      throw error;
    }
  }

  return uploaded;
}

export async function deleteWoundPhoto(photoId: string): Promise<void> {
  await apiRequest<void>(`/api/wounds/photos/${encodeURIComponent(photoId)}`, { method: 'DELETE' });
  await deleteWoundPhotoCache(photoId).catch(() => undefined);
}

export async function listWoundPhotos(woundId: string): Promise<WoundPhoto[]> {
  return apiRequest<WoundPhoto[]>(`/api/wounds/photos?woundId=${encodeURIComponent(woundId)}`);
}

export async function listWoundStatusEvents(woundId: string): Promise<WoundStatusEvent[]> {
  return apiRequest<WoundStatusEvent[]>(`/api/wounds/events?woundId=${encodeURIComponent(woundId)}`);
}

export async function getSignedWoundPhotoUrl(storagePath: string, _expiresInSec = 3600): Promise<string> {
  return mediaUrl(storagePath);
}

export async function hydratePhotosWithSignedUrls(photos: WoundPhoto[], _expiresInSec = 3600): Promise<WoundPhoto[]> {
  return Promise.all(
    photos.map(async (photo) => {
      try {
        const cachedBlob = await getWoundPhotoCache(photo.id);
        if (cachedBlob) return { ...photo, signed_url: URL.createObjectURL(cachedBlob) };

        const url = mediaUrl(photo.storage_path);
        void fetch(url)
          .then((response) => response.ok ? response.blob() : Promise.reject(new Error(`HTTP ${response.status}`)))
          .then((blob) => saveWoundPhotoCache(photo.id, blob))
          .catch((error) => console.warn(`Falha ao cachear foto ${photo.id}:`, error));
        return { ...photo, signed_url: url };
      } catch (error) {
        console.error(`Erro ao hidratar foto ${photo.id}:`, error);
        return { ...photo, signed_url: null };
      }
    }),
  );
}

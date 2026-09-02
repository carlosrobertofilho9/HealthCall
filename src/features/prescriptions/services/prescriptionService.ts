import { apiRequest, uploadLocalMedia } from '@/lib/apiClient';
import type {
  Prescription,
  CreatePrescriptionInput,
  UploadPrescriptionPdfInput,
  MarkDeliveredInput,
  DenyRenewalInput,
  PrescriptionStatus,
} from '../types';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const LOCAL_PROFILE_ID = 'local-profile';

function assertPdfFile(file: File): void {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Apenas arquivos PDF são permitidos.');
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('O PDF excede o limite de 10MB.');
  }
}

function mediaUrl(storagePath: string): string {
  const [kind, ...rest] = storagePath.split('/');
  return `/api/media/${encodeURIComponent(kind)}/${encodeURIComponent(rest.join('/'))}`;
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
  return apiRequest<Prescription[]>('/api/prescriptions');
}

export async function createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
  return apiRequest<Prescription>('/api/prescriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updatePrescriptionStatus(id: string, status: PrescriptionStatus): Promise<Prescription> {
  return apiRequest<Prescription>(`/api/prescriptions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function markPrescriptionDelivered(input: MarkDeliveredInput): Promise<Prescription> {
  return apiRequest<Prescription>(`/api/prescriptions/${encodeURIComponent(input.prescriptionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'delivered',
      delivered_to: input.deliveredTo.trim(),
      delivered_at: new Date().toISOString(),
      delivered_by: LOCAL_PROFILE_ID,
    }),
  });
}

export async function uploadPrescriptionPdf(input: UploadPrescriptionPdfInput): Promise<{ url: string; storagePath: string }> {
  assertPdfFile(input.file);
  const uploaded = await uploadLocalMedia('prescriptions', input.file, input.file.name);

  try {
    await apiRequest<Prescription>(`/api/prescriptions/${encodeURIComponent(input.prescriptionId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        pdf_storage_path: uploaded.storagePath,
        pdf_url: uploaded.url,
        status: 'ready',
      }),
    });
  } catch (error) {
    console.error('[uploadPrescriptionPdf] PDF salvo, mas registro não foi atualizado:', error);
    throw new Error('PDF salvo, mas não foi possível atualizar o status.');
  }

  return { url: uploaded.url, storagePath: uploaded.storagePath };
}

export async function deletePrescription(id: string): Promise<void> {
  await apiRequest<void>(`/api/prescriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function batchDeletePrescriptions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await apiRequest<void>('/api/prescriptions/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function batchUpdatePrescriptionsStatus(ids: string[], status: PrescriptionStatus): Promise<void> {
  if (ids.length === 0) return;
  await apiRequest<void>('/api/prescriptions/batch-status', {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
  });
}

export async function denyPrescriptionRenewal(input: DenyRenewalInput): Promise<Prescription> {
  return apiRequest<Prescription>(`/api/prescriptions/${encodeURIComponent(input.prescriptionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'denied', denial_reason: input.reason.trim() }),
  });
}

export async function getPrescriptionPdfUrl(storagePath: string): Promise<string> {
  return mediaUrl(storagePath);
}

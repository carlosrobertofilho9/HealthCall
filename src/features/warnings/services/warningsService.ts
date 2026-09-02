import type { Warning, CreateWarningDTO, UpdateWarningDTO } from '../types';
import { apiRequest, deleteLocalMedia, uploadLocalMedia } from '@/lib/apiClient';
import {
  cacheRemoteWarningMedia,
  deleteLocalWarningMedia,
  isLocalWarningMediaUrl,
} from './localWarningMedia';

export const getWarnings = async (): Promise<Warning[]> =>
  apiRequest<Warning[]>('/api/warnings');

export const getActiveWarnings = async (): Promise<Warning[]> =>
  apiRequest<Warning[]>('/api/warnings?active=1');

export const createWarning = async (warning: CreateWarningDTO): Promise<Warning> =>
  apiRequest<Warning>('/api/warnings', {
    method: 'POST',
    body: JSON.stringify(warning),
  });

export const updateWarning = async (warning: UpdateWarningDTO): Promise<Warning> => {
  const { id, ...updates } = warning;
  return apiRequest<Warning>(`/api/warnings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

function storagePathFromMediaUrl(contentUrl: string): string | null {
  const match = contentUrl.match(/\/api\/media\/([^/]+)\/([^?#]+)/);
  if (!match) return null;
  return `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`;
}

export const deleteWarningMedia = async (contentUrl?: string | null): Promise<void> => {
  if (!contentUrl) return;

  if (isLocalWarningMediaUrl(contentUrl)) {
    await deleteLocalWarningMedia(contentUrl);
    return;
  }

  await deleteLocalWarningMedia(contentUrl).catch(() => undefined);
  const storagePath = storagePathFromMediaUrl(contentUrl);
  if (storagePath) await deleteLocalMedia(storagePath).catch(() => undefined);
};

export const deleteWarning = async (id: string, contentUrl: string): Promise<void> => {
  await apiRequest<void>(`/api/warnings/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await deleteLocalWarningMedia(contentUrl).catch(() => undefined);
};

export const uploadMedia = async (file: File): Promise<string> => {
  const uploaded = await uploadLocalMedia('warnings', file, file.name);
  await cacheRemoteWarningMedia(uploaded.url, file, file.name).catch(() => undefined);
  return uploaded.url;
};

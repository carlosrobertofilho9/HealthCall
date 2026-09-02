import {
  type CreatePendenciaDTO,
  type Pendencia,
  type UpdatePendenciaDTO,
  type PendenciaStatus,
} from '../types';
import { apiRequest } from '@/lib/apiClient';

export const getPendencias = async (): Promise<Pendencia[]> =>
  apiRequest<Pendencia[]>('/api/pendencias');

export const createPendencia = async (payload: CreatePendenciaDTO): Promise<Pendencia> =>
  apiRequest<Pendencia>('/api/pendencias', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updatePendenciaStatus = async (id: string, status: PendenciaStatus): Promise<Pendencia> =>
  apiRequest<Pendencia>(`/api/pendencias/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const deletePendencia = async (id: string): Promise<void> =>
  apiRequest<void>(`/api/pendencias/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const updatePendencia = async (payload: UpdatePendenciaDTO): Promise<Pendencia> => {
  const { id, ...updates } = payload;
  return apiRequest<Pendencia>(`/api/pendencias/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const getOpenPendencias = async (): Promise<Pendencia[]> =>
  apiRequest<Pendencia[]>('/api/pendencias?open=1');

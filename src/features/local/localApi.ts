import type { Patient } from '@/types';
import { localApiBase } from '@/lib/runtime';

export type StationRole = 'Médico' | 'Enfermagem' | 'Recepção' | 'Outro';

export type StationIdentity = {
  name: string;
  role: StationRole;
  room: string;
};

export type LocalCall = {
  id: string;
  patientId: string;
  patientName: string;
  destination: string;
  callCount: number;
  calledAt: string;
  station: StationIdentity;
};

export type DisplaySettings = {
  noticesEnabled: boolean;
};

type EventPayload =
  | { type: 'patients-changed' }
  | { type: 'call'; call: LocalCall }
  | { type: 'settings-changed'; settings: DisplaySettings };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${localApiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Falha na comunicação local (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const localApi = {
  health: () => request<{ ok: boolean; mode: 'local'; version: string }>('/api/health'),
  getPatients: () => request<Patient[]>('/api/patients'),
  addPatient: (name: string, destination: string) =>
    request<Patient>('/api/patients', {
      method: 'POST',
      body: JSON.stringify({ name, destination }),
    }),
  addPatientByNumber: (destination: string) =>
    request<Patient>('/api/patients/ficha', {
      method: 'POST',
      body: JSON.stringify({ destination }),
    }),
  updatePatient: (patient: Patient) =>
    request<Patient>(`/api/patients/${encodeURIComponent(patient.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patient),
    }),
  removePatient: (id: string) =>
    request<void>(`/api/patients/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  callPatient: (id: string, destination: string, station: StationIdentity) =>
    request<Patient>(`/api/patients/${encodeURIComponent(id)}/call`, {
      method: 'POST',
      body: JSON.stringify({ destination, station }),
    }),
  clearQueue: () => request<void>('/api/queue/clear', { method: 'POST' }),
  reorderQueue: (items: { id: string; queue_order: number }[]) =>
    request<void>('/api/queue/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  getCalls: (limit = 10) => request<LocalCall[]>(`/api/calls?limit=${limit}`),
  getSettings: () => request<DisplaySettings>('/api/settings'),
  updateSettings: (settings: Partial<DisplaySettings>) =>
    request<DisplaySettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  subscribe(onEvent: (event: EventPayload) => void) {
    const source = new EventSource(`${localApiBase}/api/events`);
    source.onmessage = (event) => {
      try {
        onEvent(JSON.parse(event.data) as EventPayload);
      } catch (error) {
        console.warn('[HealthCall Local] Evento inválido recebido', error);
      }
    };
    return () => source.close();
  },
};

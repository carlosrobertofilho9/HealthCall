import type { Patient } from '@/types';
import { apiRequest } from '@/lib/apiClient';
import { getStationDestination, getStationIdentity } from '@/features/local/stationSettings';

export async function getPatients(): Promise<Patient[]> {
  return apiRequest<Patient[]>('/api/patients');
}

export async function addPatient(name: string, destination: string): Promise<Patient | null> {
  return apiRequest<Patient>('/api/patients', {
    method: 'POST',
    body: JSON.stringify({ name, destination }),
  });
}

export async function addPatientByNumber(destination: string): Promise<Patient | null> {
  return apiRequest<Patient>('/api/patients/ficha', {
    method: 'POST',
    body: JSON.stringify({ destination }),
  });
}

export async function updatePatient(patient: Patient): Promise<Patient | null> {
  return apiRequest<Patient>(`/api/patients/${encodeURIComponent(patient.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patient),
  });
}

export async function removePatient(id: string): Promise<boolean> {
  await apiRequest<void>(`/api/patients/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
}

export async function callPatient(id: string, destination?: string): Promise<Patient | null> {
  const station = getStationIdentity();
  const stationDestination = getStationDestination();
  if (!station.room || !stationDestination) {
    throw new Error('Configure a sala deste posto antes de chamar um paciente.');
  }

  return apiRequest<Patient>(`/api/patients/${encodeURIComponent(id)}/call`, {
    method: 'POST',
    body: JSON.stringify({
      destination: stationDestination || destination,
      station,
    }),
  });
}

export async function clearQueue(): Promise<boolean> {
  await apiRequest<void>('/api/queue/clear', { method: 'POST' });
  return true;
}

export async function updateQueueOrder(items: { id: string; queue_order: number }[]): Promise<void> {
  await apiRequest<void>('/api/queue/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

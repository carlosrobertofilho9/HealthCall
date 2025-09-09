import type { Patient, PatientStatus, CallRecord } from '@/types';

export function addPatient(list: Patient[], payload: { name: string; destination: string }): Patient[] {
  const { name, destination } = payload;
  const trimmed = name.trim();
  if (!trimmed || !destination) return list;
  const newPatient: Patient = {
    id: Date.now(),
    name: trimmed,
    destination,
    status: 'Aguardando',
    callCount: 0,
  };
  return [newPatient, ...list];
}

export function updatePatient(list: Patient[], patient: Patient): Patient[] {
  return list.map((p) => (p.id === patient.id ? patient : p));
}

export function removePatient(list: Patient[], id: number): Patient[] {
  return list.filter((p) => p.id !== id);
}

export function updateStatus(list: Patient[], id: number, status: PatientStatus): Patient[] {
  return list.map((p) => (p.id === id ? { ...p, status } : p));
}

export function callPatient(
  list: Patient[],
  id: number
): { updated: Patient[]; called: Patient; next: Patient[] } | null {
  let calledPatient: Patient | null = null;
  const updated = list.map((p) => {
    if (p.id === id) {
      const updatedP: Patient = { ...p, callCount: p.callCount + 1, lastCalled: true };
      calledPatient = updatedP;
      return updatedP;
    }
    const { lastCalled, ...rest } = p as any;
    return { ...(rest as Patient) };
  });

  if (!calledPatient) return null;

  const next = updated.filter((p) => p.status === 'Aguardando' && p.id !== calledPatient!.id);
  return { updated, called: calledPatient, next };
}

export function appendCallHistory(history: CallRecord[], called: Patient, limit = 20): CallRecord[] {
  const record: CallRecord = {
    id: called.id,
    name: called.name,
    destination: called.destination,
    callCount: called.callCount,
    calledAt: Date.now(),
  };
  const arr = [record, ...history]
    .filter((rec, idx, arr2) => idx === 0 || !(rec.id === arr2[idx - 1].id && rec.callCount === arr2[idx - 1].callCount))
    .slice(0, limit);
  return arr;
}

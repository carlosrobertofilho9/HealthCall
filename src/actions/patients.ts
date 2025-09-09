import { supabase } from '../lib/supabaseClient';
import type { Patient, PatientStatus, CallRecord } from '@/types';

export async function getPatients() {
  const { data, error } = await supabase.from('patients').select('*');
  if (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
  return data as Patient[];
}

export async function addPatient(name: string, destination: string) {
  const trimmed = name.trim();
  if (!trimmed || !destination) return null;

  const { data, error } = await supabase
    .from('patients')
    .insert([{ name: trimmed, destination, status: 'Aguardando' }])
    .select();

  if (error || !data) {
    console.error('Error adding patient:', error);
    return null;
  }

  return data[0] as Patient;
}

export async function updatePatient(patient: Patient) {
  const { data, error } = await supabase
    .from('patients')
    .update(patient)
    .eq('id', patient.id)
    .select();

  if (error || !data) {
    console.error('Error updating patient:', error);
    return null;
  }
  return data[0] as Patient;
}

export async function removePatient(id: string) {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('Error removing patient:', error);
    return false;
  }
  return true;
}

export async function callPatient(patientId: string, location: string) {
  // First, get the current callCount
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .select('callCount')
    .eq('id', patientId)
    .single();

  if (patientError || !patientData) {
    console.error('Error fetching patient:', patientError);
    return null;
  }

  const newCallCount = patientData.callCount + 1;

  // Update the patient's status and callCount
  const { error: updateError } = await supabase
    .from('patients')
    .update({ status: 'Chamado', callCount: newCallCount })
    .eq('id', patientId);

  if (updateError) {
    console.error('Error updating patient:', updateError);
    return null;
  }

  // Insert a new record in the calls table
  const { data, error: callError } = await supabase
    .from('calls')
    .insert([{ patient_id: patientId, location: location }])
    .select();

  if (callError) {
    console.error('Error creating call:', callError);
    // Potentially handle inconsistency, e.g., by trying to revert the patient status update
    return null;
  }

  return data[0];
}

/* 
// Old functions (local state)

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

*/

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
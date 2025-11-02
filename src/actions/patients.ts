import { supabase } from '../lib/supabaseClient';
import type { Patient, PatientStatus, CallRecord } from '@/types';

/**
 * Fetches all patients from the database, ordered by creation date.
 * @returns {Promise<Patient[]>} A promise that resolves to an array of patient objects.
 */
export async function getPatients() {
  const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
  return data as Patient[];
}

/**
 * Adds a new patient to the database.
 * @param {string} name - The name of the patient.
 * @param {string} destination - The destination of the patient.
 * @returns {Promise<Patient | null>} A promise that resolves to the new patient object, or null if an error occurs.
 */
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

/**
 * Updates an existing patient's data.
 * @param {Patient} patient - The patient object with updated information.
 * @returns {Promise<Patient | null>} A promise that resolves to the updated patient object, or null if an error occurs.
 */
export async function updatePatient(patient: Patient) {
  // Only send updatable fields explicitly
  const payload = {
    name: patient.name,
    destination: patient.destination,
    status: patient.status,
    callCount: patient.callCount,
  };
  const { data, error } = await supabase
    .from('patients')
    .update(payload)
    .eq('id', patient.id)
    .select('*');

  if (error || !data) {
    console.error('Error updating patient:', error);
    return null;
  }
  return data[0] as Patient;
}

/**
 * Removes a patient from the database.
 * @param {string} id - The ID of the patient to remove.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
export async function removePatient(id: string) {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('Error removing patient:', error);
    return false;
  }
  return true;
}

/**
 * Removes all patients from the database.
 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
 */
export async function clearQueue() {
  const { error } = await supabase.from('patients').delete().neq('id', 0); // Hack to delete all rows
  if (error) {
    console.error('Error clearing queue:', error);
    return false;
  }
  return true;
}

/**
 * Records a call for a patient, updating their status and call count.
 * @param {string} patientId - The ID of the patient being called.
 * @param {string} location - The location from where the call is made.
 * @returns {Promise<any | null>} A promise that resolves to the new call record, or null if an error occurs.
 */
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

/**
 * Appends a new call record to the call history.
 * @param {CallRecord[]} history - The existing call history.
 * @param {Patient} called - The patient who was called.
 * @param {number} [limit=20] - The maximum number of records to keep in the history.
 * @returns {CallRecord[]} The updated call history.
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
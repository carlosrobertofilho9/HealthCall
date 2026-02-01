/**
 * @deprecated Este arquivo foi substituído por src/services/localDatabase.ts
 * Mantido para compatibilidade retroativa. Use localDatabase.ts para todas as operações de pacientes.
 */

import type { Patient, CallRecord } from '@/types';
import * as localDb from '@/services/localDatabase';

/**
 * @deprecated Use localDb.getPatients() diretamente
 */
export async function getPatients(): Promise<Patient[]> {
  return localDb.getPatients();
}

/**
 * @deprecated Use localDb.addPatient() diretamente
 */
export async function addPatient(name: string, destination: string): Promise<Patient | null> {
  return localDb.addPatient(name, destination);
}

/**
 * @deprecated Use localDb.updatePatient() diretamente
 */
export async function updatePatient(patient: Patient): Promise<Patient | null> {
  return localDb.updatePatient(patient);
}

/**
 * @deprecated Use localDb.removePatient() diretamente
 */
export async function removePatient(id: string): Promise<boolean> {
  return localDb.removePatient(id);
}

/**
 * @deprecated Use localDb.clearQueue() diretamente
 */
export async function clearQueue(): Promise<boolean> {
  return localDb.clearQueue();
}

/**
 * @deprecated Use localDb.callPatient() diretamente
 */
export async function callPatient(patientId: string, location: string): Promise<Patient | null> {
  return localDb.callPatient(patientId, location);
}

/**
 * Adiciona um novo registro de chamada ao histórico de chamadas local.
 * Esta função é um utilitário do lado do cliente para gerenciar uma lista de histórico em memória.
 * @param {CallRecord[]} history - O histórico de chamadas existente.
 * @param {Patient} called - O paciente que foi chamado.
 * @param {number} [limit=20] - O número máximo de registros a serem mantidos no histórico.
 * @returns {CallRecord[]} O histórico de chamadas atualizado.
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

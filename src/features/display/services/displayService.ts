import * as localDb from '@/services/localDatabase';
import { Patient, CallRecord } from '@/types';

/**
 * Busca o último paciente que foi chamado.
 */
export async function getCalledPatient(): Promise<Patient | null> {
    return localDb.getLastCalledPatient();
}

/**
 * Busca os próximos pacientes na fila (com status 'Aguardando').
 */
export async function getNextPatients(): Promise<Patient[]> {
    return localDb.getWaitingPatients();
}

/**
 * Busca o registro da última chamada feita, incluindo os dados do paciente associado.
 */
export async function getLastCall(): Promise<{ patient: Patient; location: string } | null> {
    return localDb.getLastCall();
}

/**
 * Busca o histórico de chamadas recentes.
 */
export async function getCallHistory(): Promise<CallRecord[]> {
    return localDb.getCallHistory();
}

/**
 * Busca um paciente específico pelo seu ID.
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    return localDb.getPatientById(patientId);
}
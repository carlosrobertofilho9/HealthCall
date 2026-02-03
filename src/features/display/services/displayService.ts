import * as localDb from '@/services/localDatabase';
import { syncClient } from '@/services/networkSyncClient';
import { Patient, CallRecord } from '@/types';

// Verifica se está rodando no Electron
const isElectron = typeof window !== 'undefined' && 'electron' in window;

/**
 * Busca o último paciente que foi chamado.
 */
export async function getCalledPatient(): Promise<Patient | null> {
    if (isElectron) {
        return localDb.getLastCalledPatient();
    }
    const lastCall = await syncClient.getLastCall();
    return lastCall ? lastCall.patient : null;
}

/**
 * Busca os próximos pacientes na fila (com status 'Aguardando').
 */
export async function getNextPatients(): Promise<Patient[]> {
    if (isElectron) {
        return localDb.getWaitingPatients();
    }
    return syncClient.getWaitingPatients();
}

/**
 * Busca o registro da última chamada feita, incluindo os dados do paciente associado.
 */
export async function getLastCall(): Promise<{ patient: Patient; location: string } | null> {
    if (isElectron) {
        return localDb.getLastCall();
    }
    return syncClient.getLastCall();
}

/**
 * Busca o histórico de chamadas recentes.
 */
export async function getCallHistory(): Promise<CallRecord[]> {
    if (isElectron) {
        return localDb.getCallHistory();
    }
    return syncClient.getCallHistory();
}

/**
 * Busca um paciente específico pelo seu ID.
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    if (isElectron) {
        return localDb.getPatientById(patientId);
    }
    return syncClient.getPatientById(patientId);
}
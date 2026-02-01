import * as localDb from '@/services/localDatabase';
import { Patient, CallRecord } from '@/types';

/**
 * Busca o último paciente que foi chamado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o paciente chamado.
 * @throws {Error} Se a busca falhar.
 */
export async function getCalledPatient(): Promise<Patient | null> {
    return localDb.getLastCalledPatient();
}

/**
 * Busca os próximos pacientes na fila (com status 'Aguardando').
 * @returns {Promise<Patient[]>} Uma promessa que resolve para uma lista de pacientes.
 * @throws {Error} Se a busca falhar.
 */
export async function getNextPatients(): Promise<Patient[]> {
    return localDb.getWaitingPatients();
}

/**
 * Busca o registro da última chamada feita, incluindo os dados do paciente associado.
 * @returns {Promise<{ patient: Patient; location: string } | null>} Uma promessa que resolve para a última chamada ou nulo.
 * @throws {Error} Se a busca falhar.
 */
export async function getLastCall(): Promise<{ patient: Patient; location: string } | null> {
    return localDb.getLastCall();
}

/**
 * Busca o histórico de chamadas recentes.
 * Retorna uma lista de registros de chamada únicos, baseados no ID do paciente.
 * @returns {Promise<CallRecord[]>} Uma promessa que resolve para o histórico de chamadas.
 * @throws {Error} Se a busca falhar.
 */
export async function getCallHistory(): Promise<CallRecord[]> {
    return localDb.getCallHistory();
}

/**
 * Busca um paciente específico pelo seu ID.
 * @param {string} patientId - O ID do paciente a ser buscado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para os dados do paciente ou nulo se não for encontrado.
 * @throws {Error} Se a busca falhar.
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    return localDb.getPatientById(patientId);
}

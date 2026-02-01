import * as localDb from '@/services/localDatabase';
import { Patient } from '@/types';

/**
 * Busca todos os pacientes da base de dados, ordenados por data de criação.
 * @returns {Promise<Patient[]>} Uma promessa que resolve para um array de pacientes.
 * @throws {Error} Se a busca falhar.
 */
export async function getPatients(): Promise<Patient[]> {
  return localDb.getPatients();
}

/**
 * Adiciona um novo paciente à base de dados.
 * @param {string} name - O nome do paciente.
 * @param {string} destination - O destino para o qual o paciente está indo.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o novo paciente, ou nulo em caso de erro.
 * @throws {Error} Se a inserção falhar.
 */
export async function addPatient(name: string, destination: string): Promise<Patient | null> {
  return localDb.addPatient(name, destination);
}

/**
 * Adiciona um novo paciente usando um número de ficha sequencial.
 * Ele obtém o próximo número disponível do banco de dados local.
 * @param {string} destination - O destino para o qual o paciente está indo.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o novo paciente.
 * @throws {Error} Se a inserção falhar.
 */
export async function addPatientByNumber(destination: string): Promise<Patient | null> {
  return localDb.addPatientByNumber(destination);
}

/**
 * Atualiza os dados de um paciente existente.
 * @param {Patient} patient - O objeto paciente com os dados atualizados.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o paciente atualizado.
 * @throws {Error} Se a atualização falhar.
 */
export async function updatePatient(patient: Patient): Promise<Patient | null> {
  return localDb.updatePatient(patient);
}

/**
 * Remove um paciente da base de dados.
 * @param {string} id - O ID do paciente a ser removido.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se bem-sucedido, `false` caso contrário.
 */
export async function removePatient(id: string): Promise<boolean> {
  return localDb.removePatient(id);
}

/**
 * Realiza o processo de chamada de um paciente.
 * Isso inclui atualizar o status e o contador de chamadas do paciente e registrar a chamada.
 * @param {string} id - O ID do paciente a ser chamado.
 * @param {string} destination - O destino para o qual o paciente está sendo chamado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para os dados do paciente atualizado.
 * @throws {Error} Se qualquer uma das operações de base de dados falhar.
 */
export async function callPatient(id: string, destination: string): Promise<Patient | null> {
  return localDb.callPatient(id, destination);
}

/**
 * Limpa completamente a fila, o histórico de chamadas e os arquivos de áudio.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se a operação for bem-sucedida.
 * @throws {Error} Se a limpeza falhar.
 */
export async function clearQueue(): Promise<boolean> {
  return localDb.clearQueue();
}

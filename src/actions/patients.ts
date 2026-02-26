import { supabase } from '../lib/supabaseClient';
import type { Patient, CallRecord } from '@/types';

/**
 * Busca todos os pacientes da base de dados, ordenados por data de criação decrescente.
 * @returns {Promise<Patient[]>} Uma promessa que resolve para um array de objetos de paciente.
 */
export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
  return data as Patient[];
}

/**
 * Adiciona um novo paciente à base de dados.
 * @param {string} name - O nome do paciente.
 * @param {string} destination - O destino do paciente.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o novo objeto de paciente, ou nulo se ocorrer um erro.
 */
export async function addPatient(name: string, destination: string): Promise<Patient | null> {
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
 * Atualiza os dados de um paciente existente na base de dados.
 *
 * Esta função recebe um objeto de paciente e atualiza o registro correspondente
 * na tabela `patients`. Apenas um subconjunto de campos (`name`, `destination`, `status`, `callCount`)
 * é atualizado para prevenir a modificação acidental de campos imutáveis como `id`.
 *
 * @param {Patient} patient - O objeto de paciente contendo os dados atualizados. O campo `id` é usado para identificar o paciente a ser atualizado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o objeto de paciente atualizado, ou `null` se ocorrer um erro.
 */
export async function updatePatient(patient: Patient): Promise<Patient | null> {
  // Envia explicitamente apenas os campos que podem ser atualizados
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
 * Remove um paciente da base de dados.
 * @param {string} id - O ID do paciente a ser removido.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se a remoção for bem-sucedida, `false` caso contrário.
 */
export async function removePatient(id: string): Promise<boolean> {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('Error removing patient:', error);
    return false;
  }
  return true;
}

/**
 * Limpa a fila chamando a função RPC `truncate_patients` no Supabase.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se a operação for bem-sucedida, `false` caso contrário.
 */
export async function clearQueue(): Promise<boolean> {
  const { error } = await supabase.rpc('truncate_patients');
  if (error) {
    console.error('Error clearing queue:', error);
    return false;
  }
  return true;
}

/**
 * Registra uma chamada para um paciente, atualizando seu status e contador de chamadas.
 * Esta função primeiro busca o paciente para obter o contador de chamadas atual,
 * depois atualiza o paciente e, finalmente, insere um novo registro na tabela `calls`.
 * @param {string} patientId - O ID do paciente que está sendo chamado.
 * @param {string} location - O local de onde a chamada está sendo feita.
 * @returns {Promise<any | null>} Uma promessa que resolve para o novo registro de chamada, ou nulo se ocorrer um erro.
 */
export async function callPatient(patientId: string, location: string): Promise<any | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc('display_enqueue_call', {
    p_patient_id: patientId,
    p_destination: location,
    p_called_by: user?.id ?? null,
  });

  if (error) {
    console.error('Error enqueueing call:', error);
    return null;
  }

  return Array.isArray(data) ? data[0] : data;
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

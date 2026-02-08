import * as localDb from '@/services/localDatabase';
import { Patient } from '@/types';

/**
 * Busca todos os pacientes da base de dados, ordenados por data de criação.
 * @returns {Promise<Patient[]>} Uma promessa que resolve para um array de pacientes.
 * @throws {Error} Se a busca falhar.
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('queue_order', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) {
      // If error relates to missing column 'queue_order', fallback to default
      if (error.code === '42703' || error.message?.includes('queue_order')) {
          console.warn('Column queue_order not found, falling back to created_at sort.');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false }); // Maintaining original DESC sort for safety
          
          if (fallbackError) throw fallbackError;
          return fallbackData || [];
      }
      console.error('Error fetching patients:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception in getPatients:', error);
    throw error;
  }
}

/**
 * Adiciona um novo paciente à base de dados.
 * @param {string} name - O nome do paciente.
 * @param {string} destination - O destino para o qual o paciente está indo.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o novo paciente, ou nulo em caso de erro.
 * @throws {Error} Se a inserção falhar.
 */
export async function addPatient(name: string, destination: string): Promise<Patient | null> {
  // Get the current max queue_order
  const { data: maxOrderData } = await supabase
    .from('patients')
    .select('queue_order')
    .order('queue_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrderData?.queue_order ?? 0) + 1;


  try {
    const { data, error } = await supabase
        .from('patients')
        .insert([{ name, destination, status: 'Aguardando', queue_order: nextOrder }])
        .select()
        .single();
    
    if (error) {
        if (error.code === '42703' || error.message?.includes('queue_order')) {
            // Fallback for missing column
             const { data: dataFallback, error: errorFallback } = await supabase
                .from('patients')
                .insert([{ name, destination, status: 'Aguardando' }])
                .select()
                .single();
             
             if (errorFallback) throw errorFallback;
             return dataFallback;
        }
        throw error;
    }
    return data;
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
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

/**
 * Updates the order of patients in the queue.
 * @param items Array of object containing id and new order
 */
export async function updateQueueOrder(items: { id: string; queue_order: number }[]): Promise<void> {
    const updates = items.map(item => 
        supabase
            .from('patients')
            .update({ queue_order: item.queue_order })
            .eq('id', item.id)
    );

    await Promise.all(updates);
}

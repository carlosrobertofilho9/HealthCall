import { supabase } from '@/lib/supabaseClient';
import { Patient, PatientStatus } from '@/types';

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
      .order('created_at', { ascending: false });
    
    if (error) {
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
  const { data, error } = await supabase
    .from('patients')
    .insert([{ name, destination, status: 'Aguardando' }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
  
  return data;
}

/**
 * Adiciona um novo paciente usando um número de ficha sequencial.
 * Ele obtém o próximo número disponível de uma função RPC do Supabase.
 * @param {string} destination - O destino para o qual o paciente está indo.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o novo paciente.
 * @throws {Error} Se a função RPC ou a inserção falharem.
 */
export async function addPatientByNumber(destination: string): Promise<Patient | null> {
  const { data: nextNumber, error: rpcError } = await supabase.rpc('get_next_ficha_number');

  if (rpcError) {
    console.error('Error getting next ficha number:', rpcError);
    throw rpcError;
  }

  const name = `Ficha ${nextNumber}`;
  return addPatient(name, destination);
}

/**
 * Atualiza os dados de um paciente existente.
 * @param {Patient} patient - O objeto paciente com os dados atualizados.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o paciente atualizado.
 * @throws {Error} Se a atualização falhar.
 */
export async function updatePatient(patient: Patient): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .update(patient)
    .eq('id', patient.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
  
  return data;
}

/**
 * Remove um paciente da base de dados.
 * @param {string} id - O ID do paciente a ser removido.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se bem-sucedido, `false` caso contrário.
 */
export async function removePatient(id: string): Promise<boolean> {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  return !error;
}

/**
 * Realiza o processo de chamada de um paciente.
 * Isso inclui atualizar o status e o contador de chamadas do paciente e registrar a chamada na tabela `calls`.
 * @param {string} id - O ID do paciente a ser chamado.
 * @param {string} destination - O destino para o qual o paciente está sendo chamado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para os dados do paciente atualizado.
 * @throws {Error} Se qualquer uma das operações de base de dados falhar.
 */
export async function callPatient(id: string, destination: string): Promise<Patient | null> {
    // First, get the current callCount
    const { data: patient, error: fetchError } = await supabase
        .from('patients')
        .select('callCount, name')
        .eq('id', id)
        .single();

    if (fetchError) {
        console.error('Error fetching patient:', fetchError);
        throw fetchError;
    }

    const newCallCount = patient.callCount + 1;

    // Update the patient's status and callCount
    const { error: updateError } = await supabase
        .from('patients')
        .update({ status: 'Chamado', callCount: newCallCount })
        .eq('id', id);
    
    if (updateError) {
        console.error('Error updating patient:', updateError);
        throw updateError;
    }

    // Insert a new record in the calls table - CRITICAL for DisplayPage realtime!
    const { data: callData, error: callError } = await supabase
        .from('calls')
        .insert([{ patient_id: id, location: destination }])
        .select();
    
    if (callError) {
        console.error('Error creating call record:', callError);
        throw callError;
    }

    // Return the updated patient data
    const { data: updatedPatient, error: selectError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
    
    if (selectError) {
        console.error('Error fetching updated patient:', selectError);
        throw selectError;
    }
    
    return updatedPatient;
}

/**
 * Limpa a fila removendo todos os pacientes criados antes do dia de hoje.
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se bem-sucedido.
 * @throws {Error} Se a exclusão falhar.
 */
export async function clearQueue(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { error } = await supabase
    .from('patients')
    .delete()
    .lt('created_at', todayISO);

  if (error) {
    console.error('Error clearing queue:', error);
    throw error;
  }

  return !error;
}

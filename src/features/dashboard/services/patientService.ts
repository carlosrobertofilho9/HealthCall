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
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { error: enqueueError } = await supabase.rpc('display_enqueue_call', {
        p_patient_id: id,
        p_destination: destination,
        p_called_by: user?.id ?? null,
    });

    if (enqueueError) {
        console.error('Error enqueueing patient call:', enqueueError);
        throw enqueueError;
    }

    const { data: updatedPatient, error: selectError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (selectError) {
        console.error('Error fetching updated patient:', selectError);
        throw selectError;
    }

    if (!updatedPatient) {
        throw new Error('Erro ao recuperar dados do paciente atualizado');
    }

    return updatedPatient;
}

/**
 * Limpa completamente a fila, o histórico de chamadas e os arquivos de áudio.
 * Esta função invoca a RPC `clear_all_data` no Supabase para limpar os dados das tabelas
 * e também limpa os arquivos de áudio do bucket `tts-audio` através da API do cliente.
 * 
 * A limpeza do storage é feita em lotes para evitar timeouts e problemas com muitos arquivos.
 *
 * @returns {Promise<boolean>} Uma promessa que resolve para `true` se a operação for bem-sucedida.
 * @throws {Error} Se a chamada RPC ou a limpeza dos arquivos falhar.
 */
export async function clearQueue(): Promise<boolean> {
	try {
		// Primeiro, lista todos os arquivos do bucket tts-audio
		// Nota: o nome correto do bucket é 'tts-audio' (não 'tts')
		const { data: files, error: listError } = await supabase.storage
			.from('tts-audio')
			.list('', {
				limit: 1000, // Limite para evitar problemas com muitos arquivos
				offset: 0,
				sortBy: { column: 'name', order: 'asc' }
			});

		if (listError) {
			console.error('Error listing files from tts-audio bucket:', listError);
			// Não lançar erro aqui, apenas avisar
			console.warn('Continuando com a limpeza das tabelas...');
		}

		// Se houver arquivos, deleta todos em lotes
		if (files && files.length > 0) {
			// Filtra apenas arquivos (ignora diretórios se houver)
			const filePaths = files
				.filter(file => file.name && !file.name.endsWith('/'))
				.map(file => file.name);

			if (filePaths.length > 0) {
				// Deleta em lotes de 100 para evitar timeouts
				const BATCH_SIZE = 100;
				for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
					const batch = filePaths.slice(i, i + BATCH_SIZE);
					const { error: deleteError } = await supabase.storage
						.from('tts-audio')
						.remove(batch);

					if (deleteError) {
						console.error(`Error deleting batch ${i / BATCH_SIZE + 1}:`, deleteError);
						// Continua tentando deletar os próximos lotes
					} else {
						console.log(`Lote ${i / BATCH_SIZE + 1}: ${batch.length} arquivos deletados.`);
					}
				}
				console.log(`Total: ${filePaths.length} arquivos de áudio processados.`);
			}
		}

		// Agora limpa as tabelas através da RPC
		const { error: rpcError } = await supabase.rpc('clear_all_data');

		if (rpcError) {
			console.error('Error clearing all data via RPC:', rpcError);
			throw new Error('Falha ao limpar os dados. Por favor, tente novamente.');
		}

		console.log('Todos os dados foram limpos com sucesso.');
		return true;
	} catch (error) {
		console.error('Exception in clearQueue:', error);
		throw error;
	}
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

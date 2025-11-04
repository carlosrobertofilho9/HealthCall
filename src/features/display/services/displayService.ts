import { supabase } from '@/lib/supabaseClient';
import { Patient, CallRecord } from '@/types';

/**
 * Busca o último paciente que foi chamado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para o paciente chamado.
 * @throws {Error} Se a busca falhar.
 */
export async function getCalledPatient(): Promise<Patient | null> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Chamado')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) throw error;
    
    return data;
}

/**
 * Busca os próximos pacientes na fila (com status 'Aguardando').
 * @returns {Promise<Patient[]>} Uma promessa que resolve para uma lista de pacientes.
 * @throws {Error} Se a busca falhar.
 */
export async function getNextPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Aguardando')
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
}

/**
 * Busca o registro da última chamada feita, incluindo os dados do paciente associado.
 * @returns {Promise<{ patient: Patient; location: string } | null>} Uma promessa que resolve para a última chamada ou nulo.
 * @throws {Error} Se a busca falhar.
 */
export async function getLastCall(): Promise<{ patient: Patient; location: string } | null> {
    const { data, error } = await supabase
        .from('calls')
        .select('*, patients(*)')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (error) throw error;

    const lastCall = data ? data[0] : null;
    if (lastCall && lastCall.patients) {
        return {
            patient: lastCall.patients as Patient,
            location: lastCall.location,
        };
    }
    
    return null;
}

/**
 * Busca o histórico de chamadas recentes.
 * Retorna uma lista de registros de chamada únicos, baseados no ID do paciente.
 * @returns {Promise<CallRecord[]>} Uma promessa que resolve para o histórico de chamadas.
 * @throws {Error} Se a busca falhar.
 */
export async function getCallHistory(): Promise<CallRecord[]> {
    const { data, error } = await supabase
        .from('calls')
        .select('*, patients(*)')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) throw error;

    if (!data) return [];

    const history = data
        .map((call: any) => ({
            id: call.patients.id,
            name: call.patients.name,
            destination: call.location,
            callCount: call.patients.callCount,
            calledAt: new Date(call.created_at).getTime(),
        }))
        .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i);
    
    return history;
}

/**
 * Busca um paciente específico pelo seu ID.
 * @param {string} patientId - O ID do paciente a ser buscado.
 * @returns {Promise<Patient | null>} Uma promessa que resolve para os dados do paciente ou nulo se não for encontrado.
 * @throws {Error} Se a busca falhar.
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
    
    if (error) throw error;
    
    return data;
}

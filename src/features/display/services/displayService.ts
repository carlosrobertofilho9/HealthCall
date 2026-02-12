import { supabase } from '@/lib/supabaseClient';
import { Patient, CallRecord } from '@/types';

type CallWithPatient = {
    location?: string | null;
    created_at?: string | null;
    patients?: Patient | Patient[] | null;
};

function toTimestamp(value: string | null | undefined): number {
    if (!value) return Date.now();
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? Date.now() : ts;
}

function extractPatient(call: CallWithPatient): Patient | null {
    if (!call?.patients) return null;
    if (Array.isArray(call.patients)) {
        return call.patients[0] ?? null;
    }
    return call.patients;
}

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
 * @returns {Promise<{ patient: Patient; location: string; calledAt: number } | null>} Uma promessa que resolve para a última chamada ou nulo.
 * @throws {Error} Se a busca falhar.
 */
export async function getLastCall(): Promise<{ patient: Patient; location: string; calledAt: number } | null> {
    const { data, error } = await supabase
        .from('calls')
        .select('*, patients(*)')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (error) throw error;

    const lastCall = (data?.[0] ?? null) as CallWithPatient | null;
    const patient = lastCall ? extractPatient(lastCall) : null;
    if (lastCall && patient) {
        return {
            patient,
            location: lastCall.location ?? patient.destination,
            calledAt: toTimestamp(lastCall.created_at),
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

    const history: CallRecord[] = [];
    const seenPatientIds = new Set<string>();

    for (const row of data as CallWithPatient[]) {
        const patient = extractPatient(row);
        if (!patient?.id || seenPatientIds.has(patient.id)) {
            continue;
        }

        seenPatientIds.add(patient.id);
        history.push({
            id: patient.id,
            name: patient.name,
            destination: row.location ?? patient.destination,
            callCount: typeof patient.callCount === 'number' ? patient.callCount : 0,
            calledAt: toTimestamp(row.created_at),
        });
    }

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

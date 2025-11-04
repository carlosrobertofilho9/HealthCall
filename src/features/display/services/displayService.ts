import { supabase } from '@/lib/supabase';
import { Patient } from '@/types';

export async function getCalledPatient(): Promise<Patient | null> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Chamado')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
        throw error;
    }
    return data;
}

export async function getNextPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Aguardando')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
}

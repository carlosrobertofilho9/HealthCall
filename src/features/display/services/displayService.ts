import { supabase } from '@/lib/supabaseClient';
import { Patient } from '@/types';

export async function getCalledPatient(): Promise<Patient | null> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Chamado')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) {
        console.error('Error fetching called patient:', error);
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
    
    if (error) {
        console.error('Error fetching next patients:', error);
        throw error;
    }
    
    return data || [];
}

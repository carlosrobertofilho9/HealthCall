import { supabase } from '@/lib/supabaseClient';
import { Patient, CallRecord } from '@/types';

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

export async function getNextPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Aguardando')
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
}

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

export async function getPatientById(patientId: string): Promise<Patient | null> {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
    
    if (error) throw error;
    
    return data;
}

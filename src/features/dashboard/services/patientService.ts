import { supabase } from '@/lib/supabaseClient';
import { Patient, PatientStatus } from '@/types';

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

export async function removePatient(id: string): Promise<boolean> {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  return !error;
}

export async function callPatient(id: string, destination: string): Promise<Patient | null> {
    const { data: patient, error: fetchError } = await supabase
        .from('patients')
        .select('callCount')
        .eq('id', id)
        .single();

    if (fetchError) {
        console.error('Error fetching patient:', fetchError);
        throw fetchError;
    }

    const { data, error } = await supabase
        .from('patients')
        .update({ status: 'Chamado', destination, callCount: patient.callCount + 1 })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error calling patient:', error);
        throw error;
    }
    
    return data;
}

export async function clearQueue(): Promise<boolean> {
  const { error } = await supabase.from('patients').delete().neq('status', 'Atendido');
  return !error;
}

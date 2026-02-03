/**
 * Serviço de Banco de Dados (Supabase)
 * Gerencia a persistência de dados na nuvem.
 */

import { supabase } from '@/lib/supabaseClient';
import { Patient, Warning, CallRecord } from '@/types';

// ============================================
// PATIENTS
// ============================================

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function addPatient(name: string, destination: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .insert([{ name, destination, status: 'Aguardando', callCount: 0 }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addPatientByNumber(destination: string): Promise<Patient | null> {
  // Logic to generate next number/name would ideally be a database function or edge function
  // For now, we'll try to determine it client-side or assume the user provides a name
  // If this was strictly "add ticket number", we might need a separate counter.
  // Assuming a simple ticket system for now:
  
  // This logic is tricky without a dedicated counter table or atomic increment.
  // Simplified for migration: Just add a "Senha" placeholder, assuming user edits or we implement proper ticketing later.
  const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  const nextNum = (count || 0) + 1;
  const name = `Senha ${nextNum}`;

  return addPatient(name, destination);
}

export async function updatePatient(patient: Patient): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .update({ 
      name: patient.name, 
      destination: patient.destination, 
      status: patient.status, 
      callCount: patient.callCount,
      audio_url: patient.audio_url 
    })
    .eq('id', patient.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function callPatient(id: string, destination: string): Promise<Patient | null> {
  // First get the current patient to increment call count
  const { data: current } = await supabase.from('patients').select('callCount').eq('id', id).single();
  const nextCount = (current?.callCount || 0) + 1;

  const { data, error } = await supabase
    .from('patients')
    .update({ 
      status: 'Chamado', 
      callCount: nextCount,
      destination: destination, // Update destination if changed during call
      lastCalled: true // This field might not exist in DB schema, check types. Assuming logic handles it.
    })
    .eq('id', id)
    .select()
    .single();

  // Reset other patients' lastCalled status
  await supabase.from('patients').update({ lastCalled: false }).neq('id', id);

  // Log call record
  if (data) {
    await supabase.from('call_history').insert({
      patient_id: id,
      name: data.name,
      destination: destination,
      called_at: new Date().toISOString()
    });
  }

  if (error) throw error;
  return data;
}

export async function removePatient(id: string): Promise<boolean> {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  return !error;
}

export async function clearQueue(): Promise<boolean> {
  const { error } = await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  return !error;
}

export async function getWaitingPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('status', 'Aguardando')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLastCalledPatient(): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('lastCalled', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore not found
  return data;
}

export async function getCallHistory(limit = 10): Promise<CallRecord[]> {
  const { data, error } = await supabase
    .from('call_history')
    .select('*')
    .order('called_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  // Map DB fields to CallRecord type if necessary
  return data?.map(d => ({
    id: d.id,
    name: d.name,
    destination: d.destination,
    callCount: 1, // History might not track count at that time
    calledAt: new Date(d.called_at).getTime()
  })) || [];
}

export async function getLastCall(): Promise<{ patient: Patient; location: string } | null> {
  const patient = await getLastCalledPatient();
  if (!patient) return null;
  return { patient, location: patient.destination };
}

export async function getUniqueDestinations(): Promise<string[]> {
  const { data, error } = await supabase.from('patients').select('destination');
  if (error) throw error;
  return [...new Set(data?.map(d => d.destination) || [])];
}

export async function getNextFichaNumber(): Promise<number> {
  const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  return (count || 0) + 1;
}

// ============================================
// WARNINGS
// ============================================

export async function getWarnings(): Promise<Warning[]> {
  const { data, error } = await supabase
    .from('warnings')
    .select('*')
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveWarnings(): Promise<Warning[]> {
  const { data, error } = await supabase
    .from('warnings')
    .select('*')
    .eq('active', true)
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getWarningById(id: string): Promise<Warning | null> {
  const { data, error } = await supabase
    .from('warnings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function addWarning(warning: Omit<Warning, 'id' | 'created_at'>): Promise<Warning | null> {
  const { data, error } = await supabase
    .from('warnings')
    .insert([warning])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWarning(id: string, updates: Partial<Warning>): Promise<Warning | null> {
  const { data, error } = await supabase
    .from('warnings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeWarning(id: string): Promise<boolean> {
  const { error } = await supabase.from('warnings').delete().eq('id', id);
  return !error;
}

export async function toggleWarningActive(id: string): Promise<Warning | null> {
  const current = await getWarningById(id);
  if (!current) return null;
  return updateWarning(id, { active: !current.active });
}

export async function reorderWarnings(orderedIds: string[]): Promise<Warning[]> {
  // This would ideally be a batch update or RPC
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('warnings').update({ order: i }).eq('id', orderedIds[i]);
  }
  return getWarnings();
}

export async function saveWarningMedia(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, file);

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);
    
  return publicUrl;
}

export async function getWarningMediaPath(localUrl: string): Promise<string> {
  // In Supabase/Web, localUrl is usually already a public URL or blob URL
  return localUrl;
}

// ============================================
// SETTINGS
// ============================================

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.value || null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) throw error;
  
  const settings: Record<string, string> = {};
  data?.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function setSetting(key: string, value: string | boolean | number, description?: string): Promise<void> {
  const stringValue = String(value);
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: stringValue, description }, { onConflict: 'key' });

  if (error) throw error;
}

export async function setMultipleSettings(settings: Record<string, string>): Promise<Record<string, string>> {
  const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
  if (error) throw error;
  return settings;
}

// ============================================
// RSS FEED
// ============================================

export interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string | null;
}

export async function fetchRssFeed(url?: string): Promise<RssItem[]> {
  if (!url) return [];
  try {
    // Note: This often fails due to CORS if the RSS feed doesn't support it.
    // In a real web app, you'd use a proxy or Edge Function.
    // For now, standard fetch.
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = Array.from(xml.querySelectorAll('item')).map(item => ({
      title: item.querySelector('title')?.textContent || '',
      description: item.querySelector('description')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      image: null // Extracting image from RSS is complex and varies by feed
    }));
    
    return items;
  } catch (e) {
    console.error('RSS Fetch error:', e);
    return [];
  }
}

// ============================================
// REALTIME / LISTENERS
// ============================================

export type DataUpdateCallback = (data: { table: string }) => void;

export function onDataUpdate(callback: DataUpdateCallback): void {
  // Subscribe to multiple channels
  const channels = ['patients', 'warnings', 'settings'].map(table => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        callback({ table });
      })
      .subscribe();
  });
}

export function offDataUpdate(callback: DataUpdateCallback): void {
  supabase.removeAllChannels();
}

// Export default
export default {
  getPatients,
  getPatientById,
  addPatient,
  addPatientByNumber,
  updatePatient,
  callPatient,
  removePatient,
  clearQueue,
  getWaitingPatients,
  getLastCalledPatient,
  getCallHistory,
  getLastCall,
  getUniqueDestinations,
  getNextFichaNumber,
  getWarnings,
  getActiveWarnings,
  getWarningById,
  addWarning,
  updateWarning,
  removeWarning,
  toggleWarningActive,
  reorderWarnings,
  saveWarningMedia,
  getWarningMediaPath,
  getSetting,
  getAllSettings,
  setSetting,
  setMultipleSettings,
  fetchRssFeed,
  onDataUpdate,
  offDataUpdate,
};

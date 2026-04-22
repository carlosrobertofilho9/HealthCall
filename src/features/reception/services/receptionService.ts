import { supabase } from '@/lib/supabaseClient';
import type { ReceptionCallHistoryItem, ReceptionMessage } from '../types';

type RawReceptionCallEvent = {
  id: string;
  patient_id: string;
  destination: string;
  call_count: number;
  created_at: string;
};

function getLocalDayRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export async function listReceptionMessages(): Promise<ReceptionMessage[]> {
  const { data, error } = await supabase
    .from('reception_messages')
    .select(`
      id,
      sender_id,
      sender_name,
      content,
      created_at,
      profiles!sender_id (
        avatar_url,
        full_name
      )
    `)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data || []) as ReceptionMessage[];
}

export async function sendReceptionMessage(content: string, senderName?: string | null): Promise<void> {
  const trimmedContent = content.trim();
  if (!trimmedContent) return;

  const { data: userData } = await supabase.auth.getUser();
  const senderId = userData.user?.id ?? null;

  const { error } = await supabase.from('reception_messages').insert({
    content: trimmedContent,
    sender_id: senderId,
    sender_name: senderName?.trim() || null,
  });

  if (error) throw error;
}

export async function ensureReceptionChatDailyReset(): Promise<void> {
  const { error } = await supabase.functions.invoke('reset-reception-chat', {
    body: {
      timeZone: 'America/Recife',
    },
  });

  if (error) throw error;
}

export async function listReceptionCallHistoryByDate(date: Date): Promise<ReceptionCallHistoryItem[]> {
  const { startIso, endIso } = getLocalDayRange(date);

  const { data, error } = await supabase
    .from('display_call_events')
    .select('id, patient_id, destination, call_count, created_at')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) throw error;

  const events = (data || []) as RawReceptionCallEvent[];
  if (events.length === 0) return [];

  const patientIds = Array.from(new Set(events.map((event) => event.patient_id).filter(Boolean)));
  const patientNames = new Map<string, string>();

  if (patientIds.length > 0) {
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('id, name')
      .in('id', patientIds);

    if (patientsError) throw patientsError;

    for (const patient of patientsData || []) {
      patientNames.set(patient.id, patient.name || 'Paciente');
    }
  }

  return events.map((event) => ({
    id: event.id,
    patientId: event.patient_id,
    patientName: patientNames.get(event.patient_id) || 'Paciente',
    destination: event.destination,
    callCount: event.call_count,
    calledAt: event.created_at,
  }));
}

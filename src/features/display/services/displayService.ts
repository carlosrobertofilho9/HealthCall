import { supabase } from '@/lib/supabaseClient';
import type { CallRecord, Patient } from '@/types';
import type { CallEvent } from '@/features/display/types';

export type DisplayCallEvent = CallEvent;

type RawCallEvent = {
  id: string;
  sequence: number;
  patient_id: string;
  destination: string;
  call_count: number;
  created_at: string;
};

type RawPendingCallEvent = {
  event_id: string;
  sequence: number;
  patient_id: string;
  patient_name: string | null;
  destination: string;
  call_count: number;
  created_at: string;
};

function toTimestamp(value?: string | null): number {
  if (!value) return Date.now();
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? Date.now() : ts;
}

function buildEvent(
  row: RawCallEvent | RawPendingCallEvent,
  patientNameFallback: string
): DisplayCallEvent {
  const isPending = 'event_id' in row;
  return {
    eventId: isPending ? row.event_id : row.id,
    sequence: row.sequence,
    patientId: row.patient_id,
    patientName: isPending ? row.patient_name || patientNameFallback : patientNameFallback,
    destination: row.destination,
    callCount: row.call_count,
    createdAt: toTimestamp(row.created_at),
  };
}

async function getPatientNamesByIds(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('patients')
    .select('id, name')
    .in('id', uniqueIds);

  if (error) throw error;

  const names = new Map<string, string>();
  for (const row of data || []) {
    names.set(row.id, row.name || 'Paciente');
  }

  return names;
}

export async function getNextPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('status', 'Aguardando')
    .order('queue_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []) as Patient[];
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();

  if (error) throw error;

  return (data as Patient | null) || null;
}

export async function getCallEvents(limit = 10): Promise<DisplayCallEvent[]> {
  const { data, error } = await supabase
    .from('display_call_events')
    .select('id, sequence, patient_id, destination, call_count, created_at')
    .order('sequence', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data || []) as RawCallEvent[];
  if (rows.length === 0) return [];

  const nameMap = await getPatientNamesByIds(rows.map((row) => row.patient_id));

  return rows.map((row) =>
    buildEvent(row, nameMap.get(row.patient_id) || 'Paciente')
  );
}

export async function getLastCall(): Promise<{ patient: Patient; location: string; calledAt: number } | null> {
  const events = await getCallEvents(1);
  const latest = events[0];
  if (!latest) return null;

  const patientData = await getPatientById(latest.patientId);
  if (!patientData) return null;

  return {
    patient: {
      ...patientData,
      destination: latest.destination,
      status: 'Chamado',
      callCount: latest.callCount,
    },
    location: latest.destination,
    calledAt: latest.createdAt,
  };
}

export async function getCallHistory(limit = 10): Promise<CallRecord[]> {
  const events = await getCallEvents(limit);

  return events.map((event) => ({
    id: event.patientId,
    name: event.patientName,
    destination: event.destination,
    callCount: event.callCount,
    calledAt: event.createdAt,
  }));
}

export async function registerDisplaySession(
  sessionId: string,
  userId: string,
  deviceName: string
): Promise<void> {
  const { error } = await supabase.rpc('display_register_session', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_device_name: deviceName,
  });

  if (error) throw error;
}

export async function heartbeatDisplaySession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('display_heartbeat', {
    p_session_id: sessionId,
  });

  if (error) throw error;
}

export async function getPendingCalls(
  sessionId: string,
  limit = 20
): Promise<DisplayCallEvent[]> {
  const { data, error } = await supabase.rpc('display_get_pending_calls', {
    p_session_id: sessionId,
    p_limit: limit,
  });

  if (error) throw error;

  const rows = (data || []) as RawPendingCallEvent[];

  return rows.map((row) =>
    buildEvent(row, row.patient_name || 'Paciente')
  );
}

export async function ackCall(
  sessionId: string,
  eventId: string,
  status: 'playing' | 'played' | 'failed',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase.rpc('display_ack_call', {
    p_session_id: sessionId,
    p_event_id: eventId,
    p_status: status,
    p_error_message: errorMessage || null,
  });

  if (error) throw error;
}

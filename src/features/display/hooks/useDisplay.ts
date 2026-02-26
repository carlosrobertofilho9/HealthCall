import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { CallRecord, Patient } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  ackCall,
  getCallHistory,
  getLastCall,
  getNextPatients,
  getPatientById,
  getPendingCalls,
  heartbeatDisplaySession,
  registerDisplaySession,
  type DisplayCallEvent,
} from '@/features/display/services/displayService';

const WARNING_DELAY_MS = 10000;
const HEARTBEAT_INTERVAL_MS = 15000;
const PENDING_POLL_INTERVAL_MS = 5000;
const SNAPSHOT_REFRESH_INTERVAL_MS = 15000;
const CALL_TIMEOUT_MS = 20000;
const BELL_TIMEOUT_MS = 3000;

const DISPLAY_SESSION_STORAGE_KEY = 'healthcall-display-session-id';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function bytesToUuidV4(bytes: Uint8Array): string {
  const normalized = new Uint8Array(bytes);
  normalized[6] = (normalized[6] & 0x0f) | 0x40;
  normalized[8] = (normalized[8] & 0x3f) | 0x80;

  const hex = Array.from(normalized, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function generateFallbackSessionId(): string {
  const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
  const bytes = new Uint8Array(16);

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
    return bytesToUuidV4(bytes);
  }

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  return bytesToUuidV4(bytes);
}

function getOrCreateDisplaySessionId(): string {
  const existing = sessionStorage.getItem(DISPLAY_SESSION_STORAGE_KEY);
  if (existing && isValidUuid(existing)) return existing;
  if (existing && !isValidUuid(existing)) {
    sessionStorage.removeItem(DISPLAY_SESSION_STORAGE_KEY);
  }

  const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
  const maybeUuid = typeof cryptoApi?.randomUUID === 'function' ? cryptoApi.randomUUID() : null;
  const created = maybeUuid && isValidUuid(maybeUuid) ? maybeUuid : generateFallbackSessionId();

  sessionStorage.setItem(DISPLAY_SESSION_STORAGE_KEY, created);
  return created;
}

function getDisplayDeviceName(): string {
  const lang = navigator.language || 'pt-BR';
  return `display-${lang}`;
}

function toCalledPatient(event: DisplayCallEvent, previous: Patient | null): Patient {
  return {
    id: event.patientId,
    name: event.patientName,
    destination: event.destination,
    status: 'Chamado',
    callCount: event.callCount,
    queue_order: previous?.queue_order || 0,
  };
}

function dedupeCallHistory(records: CallRecord[]): CallRecord[] {
  const seen = new Set<string>();
  const deduped: CallRecord[] = [];

  for (const record of records) {
    const key = `${record.id}|${record.callCount}|${record.calledAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(record);
  }

  return deduped;
}

export function useDisplay() {
  const { session } = useAuth();
  const { resume: resumeAudioContext, startHealthCheck } = useAudioContext();
  const { speak, cancel: cancelTTS } = useTextToSpeech();

  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  const mountedRef = useRef(true);
  const queueRef = useRef<DisplayCallEvent[]>([]);
  const isProcessingRef = useRef(false);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const refreshSnapshotRef = useRef<() => Promise<void>>(async () => undefined);
  const pollPendingRef = useRef<() => Promise<void>>(async () => undefined);
  const enqueueEventsRef = useRef<(events: DisplayCallEvent[]) => void>(() => undefined);

  const stopWarnings = useCallback(() => {
    setShowWarnings(false);
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const scheduleWarnings = useCallback(() => {
    if (!audioActivated || isCalling) return;

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    warningTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || isCalling) return;
      setShowWarnings(true);
    }, WARNING_DELAY_MS);
  }, [audioActivated, isCalling]);

  const refreshSnapshot = useCallback(async () => {
    const [lastCall, history, waiting] = await Promise.all([
      getLastCall(),
      getCallHistory(10),
      getNextPatients(),
    ]);

    if (!mountedRef.current) return;

    setCalledPatient(
      lastCall
        ? {
            ...lastCall.patient,
            destination: lastCall.location,
            status: 'Chamado',
          }
        : null
    );
    setCallHistory(dedupeCallHistory(history).slice(0, 10));
    setNextPatients(waiting);
  }, []);

  const playBell = useCallback(async () => {
    const bell = new Audio('/bell.mp3');
    bell.crossOrigin = 'anonymous';
    bell.preload = 'auto';
    bell.volume = 1.0;

    try {
      await bell.play();
    } catch {
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;

      const done = () => {
        if (settled) return;
        settled = true;
        bell.pause();
        bell.onended = null;
        bell.onerror = null;
        bell.src = '';
        resolve();
      };

      const timeout = setTimeout(done, BELL_TIMEOUT_MS);

      bell.onended = () => {
        clearTimeout(timeout);
        done();
      };

      bell.onerror = () => {
        clearTimeout(timeout);
        done();
      };
    });
  }, []);

  const runCallAudio = useCallback(
    async (event: DisplayCallEvent) => {
      window.dispatchEvent(new CustomEvent('healthcall:call-started'));
      window.dispatchEvent(new CustomEvent('healthcall:stop-media'));
      cancelTTS();

      await resumeAudioContext();
      await playBell();

      const text = `Chamando ${event.patientName}, para ${event.destination}`;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao reproduzir chamada')); 
        }, CALL_TIMEOUT_MS);

        speak(text)
          .then(() => {
            clearTimeout(timeout);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });
    },
    [cancelTTS, playBell, resumeAudioContext, speak]
  );

  const processQueue = useCallback(async () => {
    if (!audioActivated || isProcessingRef.current) return;

    const event = queueRef.current.shift();
    if (!event || !sessionIdRef.current) return;

    isProcessingRef.current = true;
    setIsCalling(true);
    stopWarnings();

    try {
      const patient = await getPatientById(event.patientId);
      const eventWithPatient: DisplayCallEvent = {
        ...event,
        patientName: patient?.name || event.patientName || 'Paciente',
      };

      await ackCall(sessionIdRef.current, eventWithPatient.eventId, 'playing');

      setCalledPatient((previous) => toCalledPatient(eventWithPatient, previous));

      await runCallAudio(eventWithPatient);

      await ackCall(sessionIdRef.current, eventWithPatient.eventId, 'played');

      setCallHistory((previous) => {
        const nextRecord: CallRecord = {
          id: eventWithPatient.patientId,
          name: eventWithPatient.patientName,
          destination: eventWithPatient.destination,
          callCount: eventWithPatient.callCount,
          calledAt: eventWithPatient.createdAt,
        };

        return dedupeCallHistory([nextRecord, ...previous]).slice(0, 10);
      });

      try {
        await refreshSnapshot();
      } catch {
        // mantém dados atuais e segue o fluxo
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      await ackCall(sessionIdRef.current, event.eventId, 'failed', message).catch(() => undefined);
      seenEventIdsRef.current.delete(event.eventId);
      toast.error('Falha ao anunciar chamada', {
        description: message,
      });
    } finally {
      setIsCalling(false);
      isProcessingRef.current = false;
      window.dispatchEvent(new CustomEvent('healthcall:call-finished'));
      scheduleWarnings();

      if (queueRef.current.length > 0) {
        setTimeout(() => {
          if (mountedRef.current) {
            void processQueue();
          }
        }, 150);
      }
    }
  }, [audioActivated, refreshSnapshot, runCallAudio, scheduleWarnings, stopWarnings]);

  const enqueueEvents = useCallback(
    (events: DisplayCallEvent[]) => {
      const fresh = events.filter((event) => {
        if (seenEventIdsRef.current.has(event.eventId)) return false;
        seenEventIdsRef.current.add(event.eventId);
        return true;
      });

      if (fresh.length === 0) return;

      queueRef.current.push(...fresh);
      queueRef.current.sort((a, b) => a.sequence - b.sequence);

      if (audioActivated) {
        void processQueue();
      }
    },
    [audioActivated, processQueue]
  );

  const pollPending = useCallback(async () => {
    if (!sessionIdRef.current || !audioActivated) return;

    try {
      const pending = await getPendingCalls(sessionIdRef.current, 50);
      enqueueEvents(pending);
    } catch {
      // próxima rodada de polling recupera automaticamente
    }
  }, [audioActivated, enqueueEvents]);

  useEffect(() => {
    refreshSnapshotRef.current = refreshSnapshot;
    pollPendingRef.current = pollPending;
    enqueueEventsRef.current = enqueueEvents;
  }, [enqueueEvents, pollPending, refreshSnapshot]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!audioActivated || isCalling) {
      stopWarnings();
      return;
    }

    scheduleWarnings();

    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [audioActivated, isCalling, scheduleWarnings, stopWarnings]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !audioActivated) {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    const sessionId = getOrCreateDisplaySessionId();
    sessionIdRef.current = sessionId;

    let heartbeatInterval: NodeJS.Timeout | null = null;
    let pendingPollInterval: NodeJS.Timeout | null = null;
    let snapshotInterval: NodeJS.Timeout | null = null;

    const setupRuntime = async () => {
      try {
        await registerDisplaySession(sessionId, userId, getDisplayDeviceName());

        await refreshSnapshotRef.current();
        await pollPendingRef.current();

        heartbeatInterval = setInterval(() => {
          heartbeatDisplaySession(sessionId).catch(() => undefined);
        }, HEARTBEAT_INTERVAL_MS);

        pendingPollInterval = setInterval(() => {
          void pollPendingRef.current();
        }, PENDING_POLL_INTERVAL_MS);

        snapshotInterval = setInterval(() => {
          refreshSnapshotRef.current().catch(() => undefined);
        }, SNAPSHOT_REFRESH_INTERVAL_MS);

        const channel = supabase
          .channel(`display-v3-${sessionId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'display_call_events' },
            async (payload) => {
              const row = payload.new as {
                id: string;
                sequence: number;
                patient_id: string;
                destination: string;
                call_count: number;
                created_at: string;
              };

              let patientName = 'Paciente';
              try {
                const patient = await getPatientById(row.patient_id);
                patientName = patient?.name || patientName;
              } catch {
                // fallback mantém "Paciente" quando não houver resolução imediata do nome
              }

              enqueueEventsRef.current([
                {
                  eventId: row.id,
                  sequence: row.sequence,
                  patientId: row.patient_id,
                  patientName,
                  destination: row.destination,
                  callCount: row.call_count,
                  createdAt: new Date(row.created_at).getTime(),
                },
              ]);
            }
          )
          .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
            void refreshSnapshotRef.current();
          })
          .subscribe();

        realtimeChannelRef.current = channel;
      } catch {
        toast.error('Falha ao iniciar sessão do display', {
          description: 'Tentando recuperar automaticamente...',
        });
      }
    };

    void setupRuntime();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (pendingPollInterval) clearInterval(pendingPollInterval);
      if (snapshotInterval) clearInterval(snapshotInterval);

      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [audioActivated, session?.user?.id]);

  const activateAudio = useCallback(async () => {
    if (isActivatingAudio) return;

    setIsActivatingAudio(true);

    try {
      let running = await resumeAudioContext();
      if (!running) running = await resumeAudioContext();

      if (!running) {
        throw new Error('Não foi possível ativar o áudio do navegador.');
      }

      const bell = new Audio('/bell.mp3');
      bell.crossOrigin = 'anonymous';
      bell.preload = 'auto';
      bell.volume = 0.01;
      await bell.play().catch(() => undefined);

      setAudioActivated(true);
      startHealthCheck(30000);
      toast.success('Sistema de áudio ativado');
    } catch {
      setAudioActivated(false);
      toast.error('Falha ao ativar áudio');
    } finally {
      setIsActivatingAudio(false);
    }
  }, [isActivatingAudio, resumeAudioContext, startHealthCheck]);

  return {
    calledPatient,
    nextPatients,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
    isActivatingAudio,
    showWarnings,
    stopWarnings,
  };
}

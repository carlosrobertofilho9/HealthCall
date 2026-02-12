import { useState, useEffect, useRef, useCallback } from 'react';
import { Patient, CallRecord } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Callback invocado quando uma nova chamada é inserida no realtime.
 */
export type OnNewCallCallback = (patient: Patient) => void;

/**
 * Interface pública do hook useRealtimeDisplay.
 */
export interface UseRealtimeDisplayReturn {
  calledPatient: Patient | null;
  nextPatients: Patient[];
  callHistory: CallRecord[];
  refetch: () => void;
}

// Intervalo de polling de fallback (1 minuto)
const REFETCH_INTERVAL_MS = 60000;
// Evita replay de chamada antiga no primeiro carregamento, mas captura uma chamada recém-feita.
const INITIAL_RECENT_CALL_WINDOW_MS = 15000;

type RealtimeCallPayload = {
  patient_id?: string;
  location?: string;
};

type RealtimePatientPayload = Partial<Patient> & {
  id?: string;
  name?: string;
  destination?: string;
  status?: string;
  callCount?: number;
  queue_order?: number;
};

/**
 * Hook responsável pelas subscriptions Supabase Realtime e busca de dados do display.
 *
 * Cria o canal Supabase UMA vez quando há sessão e áudio ativado, evitando
 * recriação desnecessária. Usa refs para manter o canal estável mesmo durante
 * re-renders do React (incluindo StrictMode double-mount).
 *
 * @param session - Sessão do usuário autenticado.
 * @param audioActivated - Se o áudio já foi ativado pelo usuário.
 * @param onNewCall - Callback para quando uma nova chamada é detectada.
 */
export function useRealtimeDisplay(
  session: any | null,
  audioActivated: boolean,
  onNewCall: OnNewCallCallback
): UseRealtimeDisplayReturn {
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  // Refs para manter callback e canal atualizados sem recriar o efeito
  const onNewCallRef = useRef(onNewCall);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);
  const hasHydratedRef = useRef(false);
  const lastAnnouncedCallRef = useRef<{ id: string; callCount: number } | null>(null);
  const callCountByPatientRef = useRef<Record<string, number>>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    onNewCallRef.current = onNewCall;
  }, [onNewCall]);

  /**
   * Atualiza baseline de callCount de um paciente para detectar incrementos.
   */
  const registerCallCount = useCallback((patient: Patient | null | undefined) => {
    if (!patient?.id || typeof patient.callCount !== 'number') return;
    callCountByPatientRef.current[patient.id] = patient.callCount;
  }, []);

  /**
   * Dispara callback de chamada com deduplicação por id + callCount.
   */
  const announceIfNew = useCallback((patient: Patient, source: string) => {
    if (!isMountedRef.current) return;
    if (!patient?.id || typeof patient.callCount !== 'number') return;

    const previousCallCount = callCountByPatientRef.current[patient.id] ?? 0;
    registerCallCount(patient);

    const isDuplicate =
      patient.id === lastAnnouncedCallRef.current?.id &&
      patient.callCount === lastAnnouncedCallRef.current?.callCount;

    if (isDuplicate || patient.callCount <= previousCallCount) {
      return;
    }

    lastAnnouncedCallRef.current = { id: patient.id, callCount: patient.callCount };
    console.log(`[RealtimeDisplay] Disparando chamada via ${source}:`, patient.name, '→', patient.destination);
    onNewCallRef.current(patient);
  }, [registerCallCount]);

  /**
   * Fallback redundante: detecta chamada por UPDATE em patients (incremento de callCount).
   */
  const handlePatientUpdateFallback = useCallback((payload: { new?: RealtimePatientPayload }) => {
    const row = payload.new;
    if (!row?.id || row.status !== 'Chamado' || typeof row.callCount !== 'number') {
      return;
    }

    const patient: Patient = {
      id: row.id,
      name: row.name ?? 'Paciente',
      destination: row.destination ?? 'Destino não informado',
      status: 'Chamado',
      callCount: row.callCount,
      queue_order: typeof row.queue_order === 'number' ? row.queue_order : 0,
    };

    announceIfNew(patient, 'patients.update');
  }, [announceIfNew]);

  /**
   * Busca todos os dados necessários para o display.
   */
  const fetchDisplayData = useCallback(async () => {
    const [lastCallResult, historyResult, nextPatientsResult] = await Promise.allSettled([
      displayService.getLastCall(),
      displayService.getCallHistory(),
      displayService.getNextPatients(),
    ]);

    if (!isMountedRef.current) return;

    if (lastCallResult.status === 'fulfilled') {
      const lastCallData = lastCallResult.value;
      if (lastCallData) {
        const patient = {
          ...lastCallData.patient,
          destination: lastCallData.location,
          status: 'Chamado' as const,
        };
        setCalledPatient(patient);

        if (!hasHydratedRef.current) {
          const isRecent =
            Date.now() - lastCallData.calledAt <= INITIAL_RECENT_CALL_WINDOW_MS;

          if (isRecent) {
            announceIfNew(patient, 'initial-recent-call');
          } else {
            // Baseline inicial sem replay de chamadas antigas.
            registerCallCount(patient);
            lastAnnouncedCallRef.current = { id: patient.id, callCount: patient.callCount };
          }
        } else {
          const hasBaseline = !!lastAnnouncedCallRef.current;
          const isRecent = Date.now() - lastCallData.calledAt <= INITIAL_RECENT_CALL_WINDOW_MS;

          // Se ainda não há baseline (ex.: primeira carga falhou), evita replay de chamada antiga.
          if (!hasBaseline && !isRecent) {
            registerCallCount(patient);
            lastAnnouncedCallRef.current = { id: patient.id, callCount: patient.callCount };
          } else {
            // Polling/visibilidade como fallback caso evento realtime seja perdido.
            announceIfNew(patient, 'polling-fallback');
          }
        }
      } else {
        setCalledPatient(null);
      }
    } else {
      console.warn('[RealtimeDisplay] Falha ao buscar última chamada:', lastCallResult.reason);
    }

    if (historyResult.status === 'fulfilled') {
      setCallHistory(historyResult.value);
    } else {
      console.warn('[RealtimeDisplay] Falha ao buscar histórico:', historyResult.reason);
    }

    if (nextPatientsResult.status === 'fulfilled') {
      setNextPatients(nextPatientsResult.value);
      nextPatientsResult.value.forEach((patient) => registerCallCount(patient));
    } else {
      console.warn('[RealtimeDisplay] Falha ao buscar próximos pacientes:', nextPatientsResult.reason);
    }
    hasHydratedRef.current = true;
  }, [announceIfNew, registerCallCount]);

  // Efeito principal: cria canal Supabase Realtime e busca dados iniciais
  // Usa as MESMAS condições do código original: session + audioActivated
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    reconnectAttemptRef.current = reconnectAttempt;
  }, [reconnectAttempt]);

  useEffect(() => {
    if (!session || !audioActivated) {
      hasHydratedRef.current = false;
      lastAnnouncedCallRef.current = null;
      callCountByPatientRef.current = {};
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [session, audioActivated]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!session || !audioActivated) {
      console.log('[RealtimeDisplay] Aguardando sessão e ativação de áudio...',
        { hasSession: !!session, audioActivated });
      return;
    }

    console.log(`[RealtimeDisplay] Sessão e áudio prontos, criando canal Realtime... (Tentativa ${reconnectAttempt})`);

    // Busca inicial
    fetchDisplayData();

    // Polling de fallback
    const refetchInterval = setInterval(() => {
      if (isMountedRef.current) fetchDisplayData();
    }, REFETCH_INTERVAL_MS);

    // Refetch ao retornar ao foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        fetchDisplayData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Canal Supabase Realtime
    // Remove canal anterior se existir (evita duplicação em StrictMode)
    if (channelRef.current) {
      console.log('[RealtimeDisplay] Removendo canal anterior antes de recriar');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`realtime-display-global-${Date.now()}`) // Unique name to force new channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        console.log('[RealtimeDisplay] Evento patients recebido');
        if (isMountedRef.current) fetchDisplayData();
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'patients' },
        (payload) => {
          try {
            handlePatientUpdateFallback(payload as { new?: RealtimePatientPayload });
          } catch (error) {
            console.error('[RealtimeDisplay] Erro no fallback via patients.update:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls' },
        async (payload) => {
          console.log('[RealtimeDisplay] === EVENTO INSERT calls RECEBIDO ===');
          try {
            const newCall = payload.new as RealtimeCallPayload;
            if (!newCall.patient_id) {
              console.warn('[RealtimeDisplay] INSERT calls sem patient_id, ignorando payload');
              return;
            }
            console.log('[RealtimeDisplay] Buscando paciente:', newCall.patient_id);
            const patientData = await displayService.getPatientById(newCall.patient_id);
            console.log('[RealtimeDisplay] Paciente encontrado:', patientData?.name || 'NÃO ENCONTRADO');
            if (patientData && isMountedRef.current) {
              const patient = {
                ...patientData,
                destination: newCall.location || patientData.destination,
                status: 'Chamado' as const,
              };
              announceIfNew(patient, 'calls.insert');
            }
          } catch (error) {
            console.error('[RealtimeDisplay] Erro no handler de chamada realtime:', error);
            // Mesmo com erro, para warnings via evento global como fallback
            window.dispatchEvent(new CustomEvent('healthcall:stop-media'));
          }
          if (isMountedRef.current) fetchDisplayData();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, () => {
        if (isMountedRef.current) fetchDisplayData();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calls' }, () => {
        if (isMountedRef.current) fetchDisplayData();
      })
      .subscribe((status) => {
        console.log('[RealtimeDisplay] Status da inscrição:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeDisplay] ✅ Canal Supabase Realtime ATIVO!');
          if (reconnectAttemptRef.current > 0) {
            setReconnectAttempt(0);
          }
          if (isMountedRef.current) fetchDisplayData();
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeDisplay] ❌ ${status} — agendando reconexão...`);
          
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }

          // Exponential backoff with max delay of 30s
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          console.log(`[RealtimeDisplay] Reconectando em ${delay}ms...`);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setReconnectAttempt(prev => prev + 1);
            }
            reconnectTimeoutRef.current = null;
          }, delay);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[RealtimeDisplay] Cleanup: removendo canal e interval');
      isMountedRef.current = false;
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Re-run effect when reconnectAttempt changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, audioActivated, reconnectAttempt, fetchDisplayData, announceIfNew, handlePatientUpdateFallback]);

  return {
    calledPatient,
    nextPatients,
    callHistory,
    refetch: fetchDisplayData,
  };
}

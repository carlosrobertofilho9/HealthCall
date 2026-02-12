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

  useEffect(() => {
    onNewCallRef.current = onNewCall;
  });

  /**
   * Busca todos os dados necessários para o display.
   */
  const fetchDisplayData = useCallback(async () => {
    try {
      const lastCallData = await displayService.getLastCall();
      if (lastCallData) {
        const patient = {
          ...lastCallData.patient,
          destination: lastCallData.location,
          status: 'Chamado' as const,
        };
        setCalledPatient(patient);
      }

      const history = await displayService.getCallHistory();
      setCallHistory(history);

      const nextData = await displayService.getNextPatients();
      setNextPatients(nextData);
    } catch (error) {
      // Silently handle fetch errors — dados podem ficar stale por no máximo 1 min
      console.warn('[RealtimeDisplay] Erro ao buscar dados:', error);
    }
  }, []);

  // Efeito principal: cria canal Supabase Realtime e busca dados iniciais
  // Usa as MESMAS condições do código original: session + audioActivated
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

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
        { event: 'INSERT', schema: 'public', table: 'calls' },
        async (payload) => {
          console.log('[RealtimeDisplay] === EVENTO INSERT calls RECEBIDO ===');
          try {
            const newCall = payload.new as { patient_id: string; location: string };
            console.log('[RealtimeDisplay] Buscando paciente:', newCall.patient_id);
            const patientData = await displayService.getPatientById(newCall.patient_id);
            console.log('[RealtimeDisplay] Paciente encontrado:', patientData?.name || 'NÃO ENCONTRADO');
            if (patientData && isMountedRef.current) {
              const patient = {
                ...patientData,
                destination: newCall.location,
                status: 'Chamado' as const,
              };
              console.log('[RealtimeDisplay] Chamando announceCall para:', patient.name, '→', patient.destination);
              onNewCallRef.current(patient);
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
          if (isMountedRef.current) fetchDisplayData();
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeDisplay] ❌ ${status} — agendando reconexão...`);
          
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }

          // Exponential backoff with max delay of 30s
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`[RealtimeDisplay] Reconectando em ${delay}ms...`);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              setReconnectAttempt(prev => prev + 1);
            }
          }, delay);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[RealtimeDisplay] Cleanup: removendo canal e interval');
      isMountedRef.current = false;
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Re-run effect when reconnectAttempt changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, audioActivated, reconnectAttempt]);

  return {
    calledPatient,
    nextPatients,
    callHistory,
    refetch: fetchDisplayData,
  };
}

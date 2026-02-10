import { useState, useRef, useCallback, useEffect } from 'react';
import { Patient } from '@/types';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { toast } from 'sonner';

/**
 * Representa um item na fila de chamadas.
 */
interface QueueItem {
  patient: Patient;
  retryCount: number;
}

/**
 * Interface pública do hook useCallAnnouncer.
 */
export interface UseCallAnnouncerReturn {
  /** Enfileira uma chamada de paciente para ser anunciada. */
  announceCall: (patient: Patient) => void;
  /** Se o sistema está reproduzindo uma chamada neste momento. */
  isCalling: boolean;
  /** Quantidade de chamadas aguardando na fila. */
  queueSize: number;
  /** Pré-carrega áudio dos próximos pacientes na fila. */
  preloadNextPatients: (patients: Patient[]) => Promise<void>;
}

// Constantes de configuração
const BELL_TIMEOUT_MS = 3000;
const CALL_TOTAL_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;
const MUTEX_WATCHDOG_MS = 15000;
const CHROMECAST_RELEASE_DELAY_MS = 500;

/**
 * Hook responsável exclusivamente por reproduzir a chamada do paciente.
 *
 * Implementa:
 * - Fila de chamadas: novas chamadas durante reprodução são enfileiradas (não descartadas).
 * - Deduplicação: chamadas repetidas (mesmo id + callCount) são ignoradas.
 * - Bell + TTS em sequência com timeouts de segurança.
 * - Auto-retry (1 tentativa) em caso de falha.
 * - Watchdog que reseta o mutex se ficar preso por mais de 15s.
 *
 * IMPORTANTE: Recebe `resumeAudioContext` do orquestrador (useDisplay) para
 * usar o MESMO AudioContext ativado pelo gesto do usuário. Cada chamada a
 * useAudioContext() criaria um contexto separado, e o contexto criado aqui
 * nunca teria sido aquecido pela ativação de áudio do usuário.
 *
 * @param audioActivated - Se o áudio já foi ativado pelo usuário.
 * @param resumeAudioContext - Função para retomar o AudioContext (do useDisplay).
 */
export function useCallAnnouncer(
  audioActivated: boolean,
  resumeAudioContext: () => Promise<boolean>
): UseCallAnnouncerReturn {
  const { speak, preloadTTS, cancel: cancelTTS } = useTextToSpeech();

  const [isCalling, setIsCalling] = useState(false);
  const [queueSize, setQueueSize] = useState(0);

  // Refs para manter referências atualizadas sem recriar callbacks
  const speakRef = useRef(speak);
  const preloadTTSRef = useRef(preloadTTS);
  const cancelTTSRef = useRef(cancelTTS);
  const resumeRef = useRef(resumeAudioContext);

  // Estado interno via refs (não causa re-renders desnecessários)
  const isPlayingRef = useRef(false);
  const queueRef = useRef<QueueItem[]>([]);
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Sincroniza refs com as funções mais recentes a cada render
  useEffect(() => {
    speakRef.current = speak;
    preloadTTSRef.current = preloadTTS;
    cancelTTSRef.current = cancelTTS;
    resumeRef.current = resumeAudioContext;
  });

  /**
   * Limpa o watchdog timer.
   */
  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  /**
   * Inicia o watchdog timer que reseta o mutex se ficar preso.
   */
  const startWatchdog = useCallback(() => {
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        console.warn('[CallAnnouncer] Watchdog: mutex preso, resetando...');
        audioTelemetry.trackError('mutex_watchdog', 'Mutex preso por mais de 15s, forçando reset');
        // Cancela qualquer TTS em andamento
        cancelTTSRef.current();
        isPlayingRef.current = false;
        setIsCalling(false);
      }
    }, MUTEX_WATCHDOG_MS);
  }, [clearWatchdog]);

  /**
   * Toca a campainha e aguarda sua conclusão (com timeout de segurança).
   */
  const playBell = useCallback(async (): Promise<void> => {
    const bell = new Audio('/bell.mp3');
    bell.crossOrigin = 'anonymous';
    bell.preload = 'auto';
    bell.volume = 1.0;

    try {
      await bell.play();
    } catch (err) {
      console.warn('[CallAnnouncer] Falha ao iniciar bell.play():', err);
      // Bell falhou, mas prosseguimos com o TTS
      return;
    }

    await new Promise<void>((resolve) => {
      let resolved = false;

      const done = () => {
        if (resolved) return;
        resolved = true;
        bell.pause();
        bell.onended = null;
        bell.onerror = null;
        bell.src = '';
        resolve();
      };

      const timeout = setTimeout(() => {
        console.warn('[CallAnnouncer] Timeout na campainha — prosseguindo');
        done();
      }, BELL_TIMEOUT_MS);

      bell.onended = () => {
        console.log('[CallAnnouncer] Campainha concluída');
        clearTimeout(timeout);
        done();
      };

      bell.onerror = (e) => {
        console.error('[CallAnnouncer] Erro na campainha:', e);
        clearTimeout(timeout);
        done();
      };
    });
  }, []);

  /**
   * Executa a chamada completa: para mídia → bell → TTS.
   * Retorna true se a chamada foi concluída com sucesso.
   */
  const executeCall = useCallback(async (patient: Patient): Promise<boolean> => {
    const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;

    // Para mídia de warnings imediatamente
    window.dispatchEvent(new CustomEvent('healthcall:stop-media'));

    // Aguarda Chromecast liberar stream
    await new Promise(resolve => setTimeout(resolve, CHROMECAST_RELEASE_DELAY_MS));

    // Garante AudioContext ativo (usa o MESMO contexto ativado pelo usuário)
    const isRunning = await resumeRef.current();
    if (!isRunning) {
      console.warn('[CallAnnouncer] AudioContext suspenso, tentando reativar...');
      const retryRunning = await resumeRef.current();
      if (!retryRunning) {
        console.error('[CallAnnouncer] AudioContext não pode ser retomado');
        // Continua mesmo assim — o TTS via Audio element pode funcionar sem AudioContext
      }
    }

    // Pré-carrega TTS em paralelo com a campainha
    const preloadPromise = preloadTTSRef.current(textToSpeak).catch((e) => {
      console.error('[CallAnnouncer] Erro no preload (speak tentará novamente):', e);
      return null;
    });

    // Toca campainha
    await playBell();

    // Aguarda preload completar
    await preloadPromise;

    // Usa timeout com cleanup adequado (sem Promise.race que causa leaks)
    await new Promise<void>((resolve, reject) => {
      let settled = false;

      // Timeout de segurança
      timeoutIdRef.current = setTimeout(() => {
        if (!settled) {
          settled = true;
          console.error('[CallAnnouncer] TTS timeout atingido');
          cancelTTSRef.current();
          reject(new Error('TTS timeout'));
        }
      }, CALL_TOTAL_TIMEOUT_MS);

      // Executa o speak
      speakRef.current(textToSpeak)
        .then(() => {
          if (!settled) {
            settled = true;
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            resolve();
          }
        })
        .catch((error) => {
          if (!settled) {
            settled = true;
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            reject(error);
          }
        });
    });

    return true;
  }, [playBell]);

  /**
   * Processa o próximo item da fila.
   */
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsCalling(true);
    startWatchdog();

    const item = queueRef.current.shift()!;
    setQueueSize(queueRef.current.length);

    console.log('[CallAnnouncer] Processando chamada:', item.patient.name, '→', item.patient.destination,
      item.retryCount > 0 ? `(retry ${item.retryCount})` : '');

    try {
      await executeCall(item.patient);

      // Sucesso: atualiza deduplicação
      lastCalledRef.current = { id: item.patient.id, callCount: item.patient.callCount };
      console.log('[CallAnnouncer] Chamada concluída com sucesso');
    } catch (error) {
      console.error('[CallAnnouncer] Erro na chamada:', error);
      audioTelemetry.trackError(
        'call_error',
        error instanceof Error ? error.message : String(error)
      );

      // Auto-retry se ainda não excedeu o limite
      if (item.retryCount < MAX_RETRIES) {
        console.log('[CallAnnouncer] Enfileirando retry...');
        queueRef.current.unshift({ ...item, retryCount: item.retryCount + 1 });
        setQueueSize(queueRef.current.length);
      } else {
        toast.error('Erro ao reproduzir chamada', {
          description: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        // NÃO atualiza lastCalledRef para permitir chamada manual futura
      }
    } finally {
      clearWatchdog();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      isPlayingRef.current = false;

      // Mantém visual de "chamando" por 500ms antes de transicionar
      setTimeout(() => {
        setIsCalling(false);

        // Processa próximo item da fila (se houver)
        if (queueRef.current.length > 0) {
          // Pequeno delay entre chamadas para respiração visual
          setTimeout(() => processQueue(), 300);
        }
      }, 500);
    }
  }, [executeCall, startWatchdog, clearWatchdog]);

  /**
   * Enfileira uma chamada de paciente.
   * Chamadas duplicadas (mesmo id + callCount) são ignoradas.
   */
  const announceCall = useCallback((patient: Patient) => {
    if (!audioActivated) {
      console.warn('[CallAnnouncer] Áudio não ativado, ignorando chamada');
      return;
    }

    // Deduplicação: verifica se é a mesma chamada que acabou de ser feita
    const isDuplicate =
      patient.id === lastCalledRef.current?.id &&
      patient.callCount === lastCalledRef.current?.callCount;

    if (isDuplicate) {
      console.log('[CallAnnouncer] Chamada duplicada ignorada:', patient.name);
      return;
    }

    // Verifica se já está na fila
    const alreadyQueued = queueRef.current.some(
      item => item.patient.id === patient.id && item.patient.callCount === patient.callCount
    );

    if (alreadyQueued) {
      console.log('[CallAnnouncer] Chamada já está na fila:', patient.name);
      return;
    }

    console.log('[CallAnnouncer] Enfileirando chamada:', patient.name);
    queueRef.current.push({ patient, retryCount: 0 });
    setQueueSize(queueRef.current.length);

    // Se não está reproduzindo, inicia processamento
    if (!isPlayingRef.current) {
      processQueue();
    }
  }, [audioActivated, processQueue]);

  // Pré-carregamento preditivo dos próximos pacientes
  const preloadNextPatients = useCallback(async (patients: Patient[]) => {
    if (!audioActivated || patients.length === 0) return;

    console.log(`[CallAnnouncer] Pré-carregando áudio dos próximos ${Math.min(3, patients.length)} pacientes`);

    const promises = patients.slice(0, 3).map(async (patient) => {
      try {
        const text = `Chamando ${patient.name}, para ${patient.destination}`;
        await preloadTTSRef.current(text);
        console.log(`[CallAnnouncer] Pré-carregado: ${patient.name}`);
      } catch (error) {
        console.warn(`[CallAnnouncer] Falha ao pré-carregar ${patient.name}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }, [audioActivated]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      clearWatchdog();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      cancelTTSRef.current();
      queueRef.current = [];
    };
  }, [clearWatchdog]);

  return {
    announceCall,
    isCalling,
    queueSize,
    preloadNextPatients,
  };
}

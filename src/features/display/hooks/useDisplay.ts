import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAudioContext } from '@/hooks/useAudioContext';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { audioMonitoring } from '@/lib/audioMonitoring';
import { toast } from 'sonner';
import { useCallAnnouncer } from './useCallAnnouncer';
import { useRealtimeDisplay } from './useRealtimeDisplay';
import { useWarningTimer } from './useWarningTimer';

/**
 * Hook orquestrador da página de exibição pública (display/painel).
 *
 * Compõe os hooks especializados e gerencia a ativação de áudio.
 * Retorna a mesma interface pública consumida pelo DisplayDataContext,
 * garantindo zero breaking changes.
 */
export function useDisplay() {
  const { session } = useAuth();
  const { resume: resumeAudioContext, startHealthCheck } = useAudioContext();

  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);

  // Hooks especializados — passa resumeAudioContext para compartilhar o MESMO AudioContext
  const { announceCall, isCalling, queueSize, preloadNextPatients } = useCallAnnouncer(audioActivated, resumeAudioContext);
  const { showWarnings, stopWarnings } = useWarningTimer(isCalling, audioActivated);

  // Callback para quando o realtime detecta nova chamada
  const handleNewCall = useCallback((patient: any) => {
    stopWarnings();
    announceCall(patient);
  }, [announceCall, stopWarnings]);

  const { calledPatient, nextPatients, callHistory } = useRealtimeDisplay(
    session,
    audioActivated,
    handleNewCall
  );

  // Pré-carregamento preditivo (debounced)
  useEffect(() => {
    if (!audioActivated || nextPatients.length === 0) return;

    const timeout = setTimeout(() => {
      preloadNextPatients(nextPatients);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [nextPatients, audioActivated, preloadNextPatients]);

  /**
   * Ativa o áudio do sistema (requer interação do usuário pelo browser).
   */
  const activateAudio = async () => {
    if (isActivatingAudio) {
      console.log('[Display] Ativação já em andamento, ignorando clique');
      return;
    }

    setIsActivatingAudio(true);
    const startTime = Date.now();

    try {
      console.log('[Display] Iniciando ativação de áudio...');

      // Ativa AudioContext com retry
      let isRunning = await resumeAudioContext();
      if (!isRunning) {
        console.warn('[Display] AudioContext não está running, segunda tentativa...');
        isRunning = await resumeAudioContext();
        if (!isRunning) {
          throw new Error('AudioContext não pôde ser ativado. Verifique as permissões do navegador.');
        }
      }

      // Toca campainha baixa para confirmar ativação no browser
      const bell = new Audio('/bell.mp3');
      bell.crossOrigin = 'anonymous';
      bell.preload = 'auto';
      bell.volume = 0.01;

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[Display] Timeout na campainha de ativação — prosseguindo');
          bell.pause();
          bell.src = '';
          resolve();
        }, 3000);

        bell.onended = () => {
          clearTimeout(timeout);
          bell.src = '';
          resolve();
        };

        bell.onerror = () => {
          clearTimeout(timeout);
          resolve();
        };

        bell.play().catch(() => {
          clearTimeout(timeout);
          resolve();
        });
      });

      setAudioActivated(true);

      // Inicia health check periódico (30s)
      startHealthCheck(30000);

      // Inicia monitoramento do sistema (1 min)
      audioMonitoring.start();

      console.log('[Display] Áudio ativado com sucesso!');
      const latency = Date.now() - startTime;
      audioTelemetry.trackActivation(true, latency);
      toast.success('Sistema de áudio ativado', {
        description: 'Pronto para anunciar chamadas',
      });
    } catch (error) {
      console.error('[Display] Falha na ativação:', error);
      const latency = Date.now() - startTime;
      audioTelemetry.trackActivation(false, latency);
      audioTelemetry.trackError('activation_error', error instanceof Error ? error.message : String(error));
      toast.error('Falha ao ativar áudio', {
        description: 'Tente novamente. Verifique permissões do navegador.',
      });
      setAudioActivated(false);
    } finally {
      setIsActivatingAudio(false);
    }
  };

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

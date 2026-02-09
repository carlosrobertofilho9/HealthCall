import { useState, useEffect, useRef } from 'react';
import { Patient, CallRecord } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { useAudioContext } from '@/hooks/useAudioContext';
import { audioMonitoring } from '@/lib/audioMonitoring';

/**
 * Um hook para gerenciar toda a lógica e estado da página de exibição pública.
 *
 * Este hook é responsável por:
 * - Buscar o último paciente chamado, os próximos pacientes e o histórico de chamadas.
 * - Inscrever-se em canais de tempo real do Supabase para receber atualizações de `patients` e `calls`.
 * - Lidar com a lógica de anúncio de áudio, incluindo a reprodução de um som de sino e a síntese de voz.
 * - Gerenciar o estado de ativação de áudio, que requer interação do usuário.
 * - Implementar uma lógica para evitar a repetição de anúncios para a mesma chamada.
 *
 * @returns {{
 *   calledPatient: Patient | null,
 *   nextPatients: Patient[],
 *   callHistory: CallRecord[],
 *   isCalling: boolean,
 *   audioActivated: boolean,
 *   activateAudio: () => void
 * }} Um objeto contendo o estado da página de exibição e funções de interação.
 */
export function useDisplay() {
  const { session } = useAuth();
  const { speak, preloadTTS } = useTextToSpeech();
  const { contextRef: audioContextRef, isHealthy, resume: resumeAudioContext, startHealthCheck } = useAudioContext();
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);
  const isPlayingRef = useRef(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tempo em ms para iniciar warnings após inatividade (3 segundos para teste, mudar para 10000 em produção)
  const WARNINGS_DELAY_MS = 3000;

  // Função para parar warnings imediatamente
  const stopWarnings = () => {
    setShowWarnings(false);
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  };

  // Função para reiniciar o timer de warnings
  const startWarningsTimer = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    warningTimerRef.current = setTimeout(() => {
      console.log('[Warnings] Iniciando exibição de avisos após 10s de inatividade');
      setShowWarnings(true);
    }, WARNINGS_DELAY_MS);
  };

  // Efeito para gerenciar o timer de warnings baseado no estado de chamada
  useEffect(() => {
    if (!audioActivated) return;

    if (isCalling) {
      // Parar warnings imediatamente quando uma chamada começa
      console.log('[Warnings] Chamada detectada, parando avisos');
      stopWarnings();
    } else {
      // Iniciar timer quando não está chamando
      console.log('[Warnings] Sem chamada ativa, iniciando timer de 10s');
      startWarningsTimer();
    }

    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [isCalling, audioActivated]);

  const activateAudio = async () => {
    if (isActivatingAudio) {
      console.log('[Audio] Ativação já em andamento, ignorando clique');
      return;
    }

    setIsActivatingAudio(true);
    const startTime = Date.now();

    try {
      console.log('[Audio] Iniciando ativação de áudio...');

      // Usa hook de AudioContext com health check
      await resumeAudioContext();

      // Toca campainha baixa para ativar áudio
      const bell = new Audio('/bell.mp3');
      bell.crossOrigin = 'anonymous';
      bell.preload = 'auto';
      bell.volume = 0.01;

      // Aguarda confirmação de que o áudio foi ativado
      await new Promise<void>((resolve, reject) => {
        // Timeout inteligente: Se demorar muito, assumimos que o áudio está ativo (já que resumeAudioContext passou)
        // mas a campainha falhou/atrasou. Não bloqueamos o usuário.
        const timeout = setTimeout(() => {
          console.warn('[Audio] Timeout na campainha de ativação - Prosseguindo para não bloquear atendimento');
          bell.pause();
          bell.src = '';
          resolve();
        }, 3000);

        bell.onended = () => {
          clearTimeout(timeout);
          bell.src = '';
          resolve();
        };

        bell.onerror = (e) => {
          clearTimeout(timeout);
          console.error('[Audio] Erro na campainha de ativação (ignorado):', e);
          // Falha na campainha não deve impedir o uso do sistema. 
          // O importante é que o resumeAudioContext() funcionou.
          resolve();
        };

        bell.play().catch((err) => {
          clearTimeout(timeout);
          console.warn('[Audio] Falha não-crítica no play da ativação (arquivo pode estar indisponível):', err);
          // Se o play falhar (ex: 503 no arquivo de som), mas o resumeAudioContext passou,
          // consideramos sucesso para não bloquear o uso do sistema.
          resolve();
        });
      });

      setAudioActivated(true);

      // Inicia health check periódico (a cada 30 segundos)
      startHealthCheck(30000);

      // Inicia monitoramento do sistema (a cada 1 minuto)
      audioMonitoring.start();

      console.log('[Audio] Áudio ativado com sucesso!');
      const latency = Date.now() - startTime;
      audioTelemetry.trackActivation(true, latency);
      toast.success('Sistema de áudio ativado', {
        description: 'Pronto para anunciar chamadas',
      });
    } catch (error) {
      console.error('[Audio] Falha na ativação:', error);
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

  // Pré-carregamento preditivo dos próximos pacientes
  useEffect(() => {
    if (!audioActivated || nextPatients.length === 0) return;

    const preloadNextPatients = async () => {
      console.log(`[Audio] Pré-carregando áudio dos próximos ${Math.min(3, nextPatients.length)} pacientes`);

      // Pré-carrega áudio dos próximos 3 pacientes
      const promises = nextPatients.slice(0, 3).map(async (patient) => {
        try {
          const text = `Chamando ${patient.name}, para ${patient.destination}`;
          await preloadTTS(text);
          console.log(`[Audio] Pré-carregado: ${patient.name}`);
        } catch (error) {
          // Falha silenciosa, tentará novamente quando chamar
          console.warn(`[Audio] Falha ao pré-carregar ${patient.name}:`, error);
        }
      });

      await Promise.allSettled(promises);
    };

    // Debounce para evitar múltiplas chamadas
    const timeout = setTimeout(preloadNextPatients, 1000);
    return () => clearTimeout(timeout);
  }, [nextPatients, audioActivated, preloadTTS]);

  useEffect(() => {
    if (!session || !audioActivated) return;

    const playBellAndSpeak = async (patient: Patient) => {
      // Mutex: Verifica se já está tocando
      if (isPlayingRef.current) {
        console.log('[Audio] Já existe uma reprodução em andamento, ignorando');
        return;
      }

      // Verifica se é duplicata ANTES de atualizar ref
      const isDuplicate =
        patient.id === lastCalledRef.current?.id &&
        patient.callCount === lastCalledRef.current?.callCount;

      if (isDuplicate) {
        console.log('[Audio] Chamada duplicada ignorada:', patient.name);
        return;
      }

      // Ativa mutex
      isPlayingRef.current = true;

      console.log('[Audio] Iniciando chamada:', patient.name, '→', patient.destination);
      setIsCalling(true);

      // Garante que AudioContext está ativo usando hook de health check
      await resumeAudioContext();

      try {
        const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;

        // Inicia o pré-carregamento do TTS em paralelo com a campainha
        let preloadError: Error | null = null;
        const preloadPromise = preloadTTS(textToSpeak).catch((e) => {
          preloadError = e;
          console.error('[Audio] Erro no preload, speak() tentará novamente:', e);
          return null; // Não propaga erro, speak() tentará
        });

        // Toca a campainha
        const bell = new Audio('/bell.mp3');
        bell.crossOrigin = 'anonymous';
        bell.preload = 'auto';
        bell.volume = 1.0;

        await bell.play();

        // Aguarda a campainha terminar (com timeout de segurança)
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

          // Timeout de segurança de 4s (o arquivo tem ~2-3s)
          const timeout = setTimeout(() => {
            console.warn('[Audio] Timeout na reprodução da campainha - prosseguindo');
            done();
          }, 4000);

          bell.onended = () => {
            console.log('[Audio] Campainha concluída');
            clearTimeout(timeout);
            done();
          };

          bell.onerror = (e) => {
            console.error('[Audio] Erro na campainha:', e);
            toast.error('Erro ao tocar a campainha', {
              description: 'Continuando com o anúncio...',
            });
            clearTimeout(timeout);
            done();
          };
        });

        // Aguarda o preload estar completo
        await preloadPromise;

        // Se preload falhou, speak() tentará gerar novamente
        if (preloadError) {
          console.log('[Audio] Preload falhou, speak() tentará novamente');
        }

        // Toca o TTS (usa cache se preload foi bem-sucedido)
        await speak(textToSpeak);

        // Atualiza ref SOMENTE após sucesso completo
        lastCalledRef.current = { id: patient.id, callCount: patient.callCount };
        console.log('[Audio] Chamada concluída com sucesso');
      } catch (error) {
        console.error('[Audio] Erro na chamada:', error);
        toast.error('Erro ao reproduzir áudio da chamada', {
          description: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        // NÃO atualiza lastCalledRef em caso de erro para permitir retry
      } finally {
        // Libera mutex imediatamente para permitir próximas chamadas
        isPlayingRef.current = false;

        // Mantém visual de "chamando" por 500ms
        setTimeout(() => {
          setIsCalling(false);
        }, 500);
      }
    };

    const fetchDisplayData = async () => {
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
        // Silently handle fetch errors
      }
    };

    fetchDisplayData();

    const refetchInterval = setInterval(fetchDisplayData, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDisplayData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase
      .channel('realtime-display-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchDisplayData)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls' },
        async (payload) => {
          const newCall = payload.new as { patient_id: string; location: string };
          const patientData = await displayService.getPatientById(newCall.patient_id);
          if (patientData) {
            const patient = {
              ...patientData,
              destination: newCall.location,
              status: 'Chamado' as const,
            };
            playBellAndSpeak(patient);
          }
          fetchDisplayData();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, fetchDisplayData)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calls' }, fetchDisplayData)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchDisplayData();
        }
      });

    return () => {
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [session, audioActivated]);

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

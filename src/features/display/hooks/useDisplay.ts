import { useState, useEffect, useRef } from 'react';
import { Patient, CallRecord } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

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
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);

  const activateAudio = async () => {
    try {
      console.log('[Audio] Iniciando ativação de áudio...');

      // Cria e ativa AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Toca campainha baixa para ativar áudio
      const bell = new Audio('/bell.mp3');
      bell.crossOrigin = 'anonymous';
      bell.preload = 'auto';
      bell.volume = 0.01;

      // Aguarda confirmação de que o áudio foi ativado
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao ativar áudio'));
        }, 5000);

        bell.onended = () => {
          clearTimeout(timeout);
          resolve();
        };

        bell.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Erro ao tocar campainha de ativação'));
        };

        bell.play().catch(reject);
      });

      setAudioActivated(true);
      console.log('[Audio] Áudio ativado com sucesso!');
      toast.success('Sistema de áudio ativado', {
        description: 'Pronto para anunciar chamadas',
      });
    } catch (error) {
      console.error('[Audio] Falha na ativação:', error);
      toast.error('Falha ao ativar áudio', {
        description: 'Tente novamente. Verifique permissões do navegador.',
      });
      setAudioActivated(false);
    }
  };

  useEffect(() => {
    if (!session || !audioActivated) return;

    const playBellAndSpeak = async (patient: Patient) => {
      // Verifica se é duplicata ANTES de atualizar ref
      const isDuplicate =
        patient.id === lastCalledRef.current?.id &&
        patient.callCount === lastCalledRef.current?.callCount;

      if (isDuplicate) {
        console.log('[Audio] Chamada duplicada ignorada:', patient.name);
        return;
      }

      console.log('[Audio] Iniciando chamada:', patient.name, '→', patient.destination);
      setIsCalling(true);

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

        // Aguarda a campainha terminar
        await new Promise<void>((resolve, reject) => {
          bell.onended = () => {
            console.log('[Audio] Campainha concluída');
            resolve();
          };
          bell.onerror = (e) => {
            console.error('[Audio] Erro na campainha:', e);
            toast.error('Erro ao tocar a campainha', {
              description: 'Continuando com o anúncio...',
            });
            resolve(); // Continua mesmo com erro na campainha
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
        setTimeout(() => setIsCalling(false), 500);
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
  };
}

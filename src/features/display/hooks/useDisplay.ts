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

  const activateAudio = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const bell = new Audio('/bell.mp3');
    // Configurações para Chromecast
    bell.crossOrigin = 'anonymous';
    bell.preload = 'auto';
    bell.volume = 0.01;
    bell.play().catch(() => {});
    setAudioActivated(true);
  };

  useEffect(() => {
    if (!session || !audioActivated) return;

    const playBellAndSpeak = async (patient: Patient) => {
      if (
        patient.id === lastCalledRef.current?.id &&
        patient.callCount === lastCalledRef.current?.callCount
      ) {
        return;
      }
      lastCalledRef.current = { id: patient.id, callCount: patient.callCount };

      setIsCalling(true);
      try {
        const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;

        // Inicia o pré-carregamento do TTS imediatamente (em paralelo)
        // Isso começa a gerar/baixar o áudio enquanto a campainha toca
        const preloadPromise = preloadTTS(textToSpeak).catch(() => {
          // Ignora erro no preload, speak() vai tentar novamente
        });

        // Toca a campainha
        const bell = new Audio('/bell.mp3');
        // Configurações para Chromecast
        bell.crossOrigin = 'anonymous';
        bell.preload = 'auto';
        bell.volume = 1.0;

        await bell.play();

        // Aguarda a campainha terminar
        await new Promise<void>((resolve) => {
          bell.onended = () => resolve();
          bell.onerror = (e) => {
            toast.error('Erro ao tocar a campainha.', {
              description: (e.target as HTMLAudioElement)?.error?.message,
            });
            resolve(); // Resolve mesmo em caso de erro da campainha para tentar falar
          };
        });

        // Aguarda o preload estar completo (provavelmente já estará)
        await preloadPromise;

        // Agora toca o TTS (que já está carregado/em cache)
        await speak(textToSpeak);
      } catch (error) {
        toast.error('Ocorreu um erro ao reproduzir o áudio da chamada.');
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

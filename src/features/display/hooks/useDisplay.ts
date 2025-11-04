import { useState, useEffect, useRef } from 'react';
import { Patient, CallRecord } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';
import { STORAGE_KEYS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export function useDisplay() {
  const { session } = useAuth();
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
        const useBrowserVoice = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.USE_BROWSER_VOICE) || 'false'
        );

        const bell = new Audio('/bell.mp3');
        await bell.play();

        await new Promise<void>((resolve, reject) => {
          bell.onended = async () => {
            try {
              if (useBrowserVoice) {
                const utterance = new SpeechSynthesisUtterance(
                  `Chamando ${patient.name}, para ${patient.destination}`
                );
                utterance.lang = 'pt-BR';
                speechSynthesis.speak(utterance);
                utterance.onend = () => resolve();
                utterance.onerror = (e) => reject(e);
              } else {
                const { data, error } = await supabase.functions.invoke('generate-tts', {
                  body: { text: `Chamando ${patient.name}, para ${patient.destination}` },
                });

                if (error) throw new Error(`Erro ao invocar função: ${error.message}`);
                if (!data?.speechUrl)
                  throw new Error('Falha ao gerar áudio TTS: URL não recebida.');

                const speechAudio = new Audio(data.speechUrl);
                speechAudio.play();
                speechAudio.onended = () => resolve();
                speechAudio.onerror = (e) => reject(e);
              }
            } catch (e) {
              reject(e);
            }
          };
          bell.onerror = (e) => reject(e);
        });
      } catch (error) {
        // Silently handle audio errors
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

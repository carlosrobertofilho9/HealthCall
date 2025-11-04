import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { CallRecord, Patient } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { STORAGE_KEYS } from '@/constants';

interface DisplayDataContextProps {
  calledPatient: Patient | null;
  nextPatients: Patient[];
  callHistory: CallRecord[];
  isCalling: boolean;
  audioActivated: boolean;
  activateAudio: () => void;
}

const DisplayDataContext = createContext<DisplayDataContextProps | undefined>(undefined);

export const DisplayDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);

  const activateAudio = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const bell = new Audio('/bell.mp3');
    bell.volume = 0.01;
    bell.play().catch(e => console.error("Erro ao pré-carregar áudio:", e));
    setAudioActivated(true);
  };

  useEffect(() => {
    console.log('📺 DisplayDataContext: session =', session, 'audioActivated =', audioActivated);
    if (!session || !audioActivated) return;

    const playBellAndSpeak = async (patient: Patient) => {
      console.log('🔔 playBellAndSpeak called for:', patient);
      if (
        patient.id === lastCalledRef.current?.id &&
        patient.callCount === lastCalledRef.current?.callCount
      ) {
        console.log('⏭️ Skipping duplicate call');
        return;
      }
      lastCalledRef.current = { id: patient.id, callCount: patient.callCount };

      setIsCalling(true);
      try {
        const useBrowserVoice = JSON.parse(localStorage.getItem(STORAGE_KEYS.USE_BROWSER_VOICE) || 'false');

        const bell = new Audio('/bell.mp3');
        await bell.play();

        await new Promise<void>((resolve, reject) => {
          bell.onended = async () => {
            try {
              if (useBrowserVoice) {
                const utterance = new SpeechSynthesisUtterance(`Chamando ${patient.name}, para ${patient.destination}`);
                utterance.lang = 'pt-BR';
                speechSynthesis.speak(utterance);
                utterance.onend = () => resolve();
                utterance.onerror = (e) => {
                  console.error("Erro na síntese de voz:", e);
                  reject(e);
                };
              } else {
                const { data, error } = await supabase.functions.invoke('generate-tts', {
                  body: { text: `Chamando ${patient.name}, para ${patient.destination}` },
                });

                if (error) throw new Error(`Erro ao invocar função: ${error.message}`);
                if (!data?.speechUrl) throw new Error('Falha ao gerar áudio TTS: URL não recebida.');

                const speechAudio = new Audio(data.speechUrl);
                speechAudio.play();
                speechAudio.onended = () => resolve();
                speechAudio.onerror = (e) => {
                  console.error("Erro ao tocar áudio da fala:", e);
                  reject(e);
                };
              }
            } catch (e) {
              reject(e);
            }
          };
          bell.onerror = (e) => {
            console.error("Erro ao tocar sino:", e);
            reject(e);
          };
        });
      } catch (error) {
        console.error('Erro durante a chamada de áudio:', error);
      } finally {
        setTimeout(() => setIsCalling(false), 500);
      }
    };

    const fetchDisplayData = async () => {
      console.log('📺 fetchDisplayData: Fetching display data...');
      const { data: lastCalls } = await supabase
        .from('calls')
        .select('*, patients(*)')
        .order('created_at', { ascending: false })
        .limit(1);
      const lastCall = lastCalls ? lastCalls[0] : null;
      console.log('📺 Last call:', lastCall);
      if (lastCall && lastCall.patients) {
        const patient = {
          ...lastCall.patients,
          destination: lastCall.location,
          status: 'Chamado',
        };
        console.log('📺 Setting called patient:', patient);
        setCalledPatient(patient as Patient);
      }

      const { data: historyData } = await supabase
        .from('calls')
        .select('*, patients(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      console.log('📺 History data:', historyData?.length, 'records');
      if (historyData) {
        const history = historyData
          .map((call) => ({
            id: call.patients.id,
            name: call.patients.name,
            destination: call.location,
            callCount: call.patients.callCount,
            calledAt: new Date(call.created_at).getTime(),
          }))
          .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
        setCallHistory(history);
      }

      const { data: nextData } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'Aguardando')
        .order('created_at', { ascending: true });
      console.log('📺 Next patients:', nextData?.length, 'in queue');
      if (nextData) {
        setNextPatients(nextData);
      }
    };

    console.log('📺 DisplayDataContext: Setting up subscriptions and intervals');
    const refetchInterval = setInterval(fetchDisplayData, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📺 Page became visible, refetching data');
        fetchDisplayData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase
      .channel('realtime-display-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        console.log('📺 Display: patients table changed:', payload);
        fetchDisplayData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls' }, async (payload) => {
        console.log('📞 Display: NEW CALL detected!', payload);
        const newCall = payload.new as { patient_id: string; location: string };
        const { data: patientDataArr } = await supabase
          .from('patients')
          .select('*')
          .eq('id', newCall.patient_id);
        const patientData = patientDataArr ? patientDataArr[0] : null;
        console.log('👤 Display: Patient data for call:', patientData);
        if (patientData) {
          const patient = {
            ...patientData,
            destination: newCall.location,
            status: 'Chamado',
          };
          console.log('🔔 Display: Playing bell and speaking for:', patient);
          playBellAndSpeak(patient as Patient);
        }
        fetchDisplayData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, (payload) => {
        console.log('📺 Display: calls UPDATE:', payload);
        fetchDisplayData();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calls' }, (payload) => {
        console.log('📺 Display: calls DELETE:', payload);
        fetchDisplayData();
      })
      .subscribe((status, err) => {
        console.log('📡 Display: Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Display: Successfully subscribed to realtime');
          fetchDisplayData();
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Display: Realtime channel error. Attempting to reconnect...', err);
        }
      });

    return () => {
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [session, audioActivated]);

  const value = {
    calledPatient,
    nextPatients,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
  };

  return <DisplayDataContext.Provider value={value}>{children}</DisplayDataContext.Provider>;
};

export const useDisplayData = () => {
  const context = useContext(DisplayDataContext);
  if (context === undefined) {
    throw new Error('useDisplayData must be used within a DisplayDataProvider');
  }
  return context;
};

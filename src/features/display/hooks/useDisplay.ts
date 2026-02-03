import { useState, useEffect, useRef } from 'react';
import { syncClient } from '@/services/networkSyncClient';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Patient, CallRecord } from '@/types';

export function useDisplay() {
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [lastCallLocation, setLastCallLocation] = useState<string>('');
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  
  const { speak } = useTextToSpeech();
  const lastCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Carregamento inicial
    const loadData = async () => {
      try {
        const [lastCall, history, waiting] = await Promise.all([
          syncClient.getLastCall(),
          syncClient.getCallHistory(),
          syncClient.getWaitingPatients()
        ]);

        if (lastCall) {
          setCalledPatient(lastCall.patient);
          setLastCallLocation(lastCall.location);
        }
        
        setCallHistory(history);
        setNextPatients(waiting);
      } catch (error) {
        console.error('Erro ao carregar dados do display:', error);
      }
    };

    loadData();

    // Listener para atualizações em tempo real
    const handleUpdate = async (event: any) => {
      // Recarrega dados relevantes quando houver atualização
      await loadData();
      
      // Verifica se houve nova chamada para anunciar
      const lastCall = await syncClient.getLastCall();
      if (lastCall && lastCall.patient.id !== lastCallIdRef.current) {
        lastCallIdRef.current = lastCall.patient.id;
        
        // Anuncia voz
        const message = `${lastCall.patient.name}, comparecer ao ${lastCall.location}.`;
        speak(message);
      }
    };

    syncClient.on('data_update', handleUpdate);

    return () => {
      syncClient.off('data_update', handleUpdate);
    };
  }, [speak]);

  return {
    calledPatient,
    nextPatients,
    lastCallLocation,
    callHistory
  };
}
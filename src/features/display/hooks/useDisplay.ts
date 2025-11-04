import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-toastify';

export function useDisplay() {
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<Patient[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);

  const fetchDisplayData = useCallback(async () => {
    try {
      const [called, next] = await Promise.all([
        displayService.getCalledPatient(),
        displayService.getNextPatients(),
      ]);
      setCalledPatient(called);
      setNextPatients(next);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  useEffect(() => {
    fetchDisplayData();

    const channel = supabase
      .channel('realtime-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        if (payload.new && (payload.new as Patient).status === 'Chamado') {
            setIsCalling(true);
            setTimeout(() => setIsCalling(false), 5000); // Show calling animation for 5s
        }
        fetchDisplayData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDisplayData]);

  useEffect(() => {
    if (calledPatient) {
        setCallHistory(prev => [calledPatient, ...prev.filter(p => p.id !== calledPatient.id)].slice(0, 10));
    }
  }, [calledPatient])

  const activateAudio = () => {
    setAudioActivated(true);
  };

  return {
    calledPatient,
    nextPatients,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio
  };
}

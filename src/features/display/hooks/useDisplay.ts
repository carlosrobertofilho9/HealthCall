import { useState, useEffect, useRef, useCallback } from 'react';
import { syncClient } from '@/services/networkSyncClient';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAudioContext } from '@/hooks/useAudioContext';
import { Patient, CallRecord, Warning } from '@/types';

export function useDisplay() {
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [lastCallLocation, setLastCallLocation] = useState<string>('');
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  
  // UI States
  const [isCalling, setIsCalling] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  const [activeWarning, setActiveWarning] = useState<Warning | null>(null);
  const [shouldShowHeadline, setShouldShowHeadline] = useState(true);

  const { speak } = useTextToSpeech();
  const { resume: resumeAudio } = useAudioContext();
  
  const lastCallIdRef = useRef<string | null>(null);
  const callingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [lastCall, history, waiting, warnings] = await Promise.all([
        syncClient.getLastCall(),
        syncClient.getCallHistory(),
        syncClient.getWaitingPatients(),
        syncClient.getActiveWarnings()
      ]);

      if (lastCall) {
        setCalledPatient(lastCall.patient);
        setLastCallLocation(lastCall.location);
        // Sync ref to prevent re-announcing on load/refresh
        if (!lastCallIdRef.current) {
          lastCallIdRef.current = lastCall.patient.id;
        }
      }
      
      setCallHistory(history);
      setNextPatients(waiting);
      
      // Update warning state
      if (warnings && warnings.length > 0) {
        setActiveWarning(warnings[0]);
        setShouldShowHeadline(false);
      } else {
        setActiveWarning(null);
        setShouldShowHeadline(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do display:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleUpdate = async () => {
      // Refresh data
      await fetchData();

      // Check for new calls to announce
      const lastCall = await syncClient.getLastCall();
      if (lastCall && lastCall.patient.id !== lastCallIdRef.current) {
        lastCallIdRef.current = lastCall.patient.id;
        
        // Start calling sequence
        setIsCalling(true);
        const message = `${lastCall.patient.name}, comparecer ao ${lastCall.location}.`;
        speak(message);

        // Auto-dismiss calling screen after 15s
        if (callingTimeoutRef.current) clearTimeout(callingTimeoutRef.current);
        callingTimeoutRef.current = setTimeout(() => {
          setIsCalling(false);
        }, 15000);
      }
    };

    syncClient.on('data_update', handleUpdate);
    return () => {
      syncClient.off('data_update', handleUpdate);
      if (callingTimeoutRef.current) clearTimeout(callingTimeoutRef.current);
    };
  }, [fetchData, speak]);

  const activateAudio = async () => {
    setIsActivatingAudio(true);
    try {
      await resumeAudio();
      setAudioActivated(true);
    } catch (error) {
      console.error('Failed to activate audio:', error);
      // Force activation to allow UI usage even if audio fails
      setAudioActivated(true);
    } finally {
      setIsActivatingAudio(false);
    }
  };

  const handleNewsCycleComplete = () => {
    // Placeholder: Logic to rotate news or check for warnings
    fetchData(); 
  };

  const handleVideoEnd = () => {
    // Placeholder: Logic for when warning video ends
    fetchData();
  };

  return {
    calledPatient,
    nextPatients,
    lastCallLocation,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
    isActivatingAudio,
    activeWarning,
    shouldShowHeadline,
    handleNewsCycleComplete,
    handleVideoEnd
  };
}
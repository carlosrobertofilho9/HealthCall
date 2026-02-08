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
    // Cycle to next warning
    if (activeWarnings.length > 0) {
      setWarningIndex((prev) => (prev + 1) % activeWarnings.length);
    }
    // Refresh data to keep sync
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
    showWarnings,
    stopWarnings,
  };
}
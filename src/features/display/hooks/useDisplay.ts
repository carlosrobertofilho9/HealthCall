import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Patient, CallRecord, Warning } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import * as localDb from '@/services/localDatabase';
import { syncClient } from '@/services/networkSyncClient';
import { toast } from 'sonner';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { useAudioContext } from '@/hooks/useAudioContext';
import { audioMonitoring } from '@/lib/audioMonitoring';
import { useElectron } from '@/hooks/useElectron';

/**
 * Um hook para gerenciar toda a lógica e estado da página de exibição pública.
 * IMPORTANTE: A lógica de áudio só é executada quando o usuário está na rota /display.
 */
export function useDisplay() {
  const location = useLocation();
  const isOnDisplayPage = location.pathname === '/display';
  
  const { speak, preloadTTS, cancel: cancelTTS } = useTextToSpeech();
  const { resume: resumeAudioContext, startHealthCheck } = useAudioContext();
  const { isElectron, sendNotification, updateBadge } = useElectron();
  
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  
  // Warning System State
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activeWarning, setActiveWarning] = useState<Warning | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const warningCycleCompletedRef = useRef<boolean>(false);
  const lastIdleSessionRef = useRef<number>(0);
  const warningCycleRunningRef = useRef<boolean>(false);
  const videoEndResolverRef = useRef<(() => void) | null>(null);
  
  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  
  // Refs para controle de chamadas
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);
  const lastProcessedCallRef = useRef<{ id: string; callCount: number }>({ id: '', callCount: 0 });
  const isPlayingRef = useRef(false); // Indicates if a PATIENT CALL is playing
  
  const newsCycleCompletedRef = useRef<boolean>(false);
  const [shouldShowHeadline, setShouldShowHeadline] = useState(false);

  const IDLE_THRESHOLD = 10000; // 10 seconds - tempo para mostrar lista antes dos anúncios

  // Cancela qualquer áudio ao sair da página de display
  useEffect(() => {
    if (!isOnDisplayPage) {
      cancelTTS();
      setActiveWarning(null);
      setIsCalling(false);
      isPlayingRef.current = false;
      warningCycleRunningRef.current = false;
    }
  }, [isOnDisplayPage, cancelTTS]);

  // No Electron, ativa o áudio automaticamente (autoplay permitido)
  useEffect(() => {
    if (!isOnDisplayPage) return;
    
    if (isElectron && !audioActivated) {
      console.log('[Display] Electron detectado - ativando áudio automaticamente');
      const autoActivate = async () => {
        try {
          await resumeAudioContext();
          setAudioActivated(true);
          setLastActivityTime(Date.now());
          warningCycleCompletedRef.current = false;
          warningCycleRunningRef.current = false;
          lastIdleSessionRef.current = 0;
          startHealthCheck(30000);
          audioMonitoring.start();
          console.log('[Display] Áudio ativado automaticamente no Electron');
        } catch (error) {
          console.error('[Display] Erro ao ativar áudio automaticamente:', error);
        }
      };
      autoActivate();
    }
  }, [isOnDisplayPage, isElectron, audioActivated, resumeAudioContext, startHealthCheck]);

  // Callback chamado quando um vídeo termina de reproduzir
  const handleVideoEnd = useCallback(() => {
    if (videoEndResolverRef.current) {
      const resolver = videoEndResolverRef.current;
      videoEndResolverRef.current = null;
      resolver();
    }
  }, []);

  const isWarningScheduledNow = useCallback((warning: Warning) => {
    if (!warning.active) return false;
    if (!warning.start_time || !warning.end_time) return true;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    try {
        const [startHour, startMinute] = warning.start_time.split(':').map(Number);
        const [endHour, endMinute] = warning.end_time.split(':').map(Number);

        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;

        if (endTotal < startTotal) {
            return currentMinutes >= startTotal || currentMinutes <= endTotal;
        }

        return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } catch (e) {
        console.error("Error parsing warning schedule", e);
        return true;
    }
  }, []);

  const activateAudio = async () => {
    if (isActivatingAudio) return;

    setIsActivatingAudio(true);
    const startTime = Date.now();

    try {
      await resumeAudioContext();
      const bell = new Audio('/bell.mp3');
      bell.volume = 0.01;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          bell.pause();
          bell.src = '';
          reject(new Error('Timeout ao ativar áudio'));
        }, 3000);

        bell.onended = () => {
          clearTimeout(timeout);
          bell.src = '';
          resolve();
        };

        bell.onerror = (e) => {
          clearTimeout(timeout);
          bell.pause();
          bell.src = '';
          reject(new Error('Erro ao tocar campainha de ativação'));
        };

        bell.play().catch(reject);
      });

      setAudioActivated(true);
      setLastActivityTime(Date.now());
      warningCycleCompletedRef.current = false;
      warningCycleRunningRef.current = false;
      lastIdleSessionRef.current = 0;
      startHealthCheck(30000);
      audioMonitoring.start();
      audioTelemetry.trackActivation(true, Date.now() - startTime);
      toast.success('Sistema de áudio ativado - lista de atendimento será exibida por 10 segundos');
    } catch (error) {
      console.error('[Audio] Falha na ativação:', error);
      audioTelemetry.trackActivation(false, Date.now() - startTime);
      toast.error('Falha ao ativar áudio');
      setAudioActivated(false);
    } finally {
      setIsActivatingAudio(false);
    }
  };

  const handleNewsCycleComplete = useCallback(() => {
    newsCycleCompletedRef.current = true;
    setShouldShowHeadline(false);
  }, []);

  // Effect to manage shouldShowHeadline state
  useEffect(() => {
    if (!isOnDisplayPage) return;
    
    const checkHeadlineConditions = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const isIdle = timeSinceActivity > IDLE_THRESHOLD;
      const activeWarningsList = warnings.filter(isWarningScheduledNow);
      
      const warningsCompleteOrEmpty = 
        (activeWarningsList.length === 0 || warningCycleCompletedRef.current) &&
        !warningCycleRunningRef.current;
      
      const canShowHeadline = 
        !isCalling && 
        !activeWarning && 
        audioActivated &&
        isIdle &&
        warningsCompleteOrEmpty &&
        !newsCycleCompletedRef.current;
      
      if (canShowHeadline && !shouldShowHeadline) {
        setShouldShowHeadline(true);
      } else if (!canShowHeadline && shouldShowHeadline && !newsCycleCompletedRef.current) {
        if (isCalling || activeWarning || warningCycleRunningRef.current) {
          setShouldShowHeadline(false);
        }
      }
    };

    checkHeadlineConditions();
    const interval = setInterval(checkHeadlineConditions, 1000);
    return () => clearInterval(interval);
  }, [isOnDisplayPage, isCalling, activeWarning, audioActivated, lastActivityTime, warnings, shouldShowHeadline, isWarningScheduledNow]);

  const speakRef = useRef(speak);
  const lastActivityTimeRef = useRef(lastActivityTime);
  
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);
  
  useEffect(() => {
    lastActivityTimeRef.current = lastActivityTime;
  }, [lastActivityTime]);

  // Warning Cycle Logic
  useEffect(() => {
    if (!isOnDisplayPage) return;
    
    if (!audioActivated || warnings.length === 0) {
      warningCycleCompletedRef.current = false;
      warningCycleRunningRef.current = false;
      return;
    }

    const playAllWarnings = async (activeWarningsList: Warning[]) => {
      if (!isOnDisplayPage) {
        warningCycleRunningRef.current = false;
        return;
      }
      
      if (warningCycleRunningRef.current) return;
      
      warningCycleRunningRef.current = true;
      warningCycleCompletedRef.current = false;

      for (let i = 0; i < activeWarningsList.length; i++) {
        const warning = activeWarningsList[i];
        
        if (isPlayingRef.current) {
          warningCycleRunningRef.current = false;
          return;
        }

        setActiveWarning(warning);

        try {
          const isLocalVideo = warning.media_type === 'video';
          const isYouTube = warning.media_type === 'youtube';
          const isImage = !warning.media_type || warning.media_type === 'image';
          
          if (isLocalVideo) {
            videoEndResolverRef.current = null;
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                videoEndResolverRef.current = resolve;
              }, 500);
              setTimeout(() => {
                if (videoEndResolverRef.current === resolve) {
                  resolve();
                  videoEndResolverRef.current = null;
                }
              }, 5 * 60 * 1000);
            });
          } else if (isYouTube) {
            const videoDuration = warning.duration || 30;
            await new Promise(r => setTimeout(r, videoDuration * 1000));
          } else if (isImage) {
            const displayDuration = warning.duration || 15;
            
            if (warning.audio_url) {
              try {
                const audio = new Audio(warning.audio_url);
                audio.volume = 1.0;
                
                await Promise.race([
                  new Promise<void>((resolve, reject) => {
                    audio.onended = () => resolve();
                    audio.onerror = (e) => reject(e);
                    audio.play().catch(reject);
                  }),
                  new Promise<void>((resolve) => setTimeout(resolve, displayDuration * 1000))
                ]);
              } catch (audioError) {
                await new Promise(r => setTimeout(r, displayDuration * 1000));
              }
            } else if (warning.text) {
              try {
                await Promise.race([
                  speakRef.current(warning.text),
                  new Promise<void>((resolve) => setTimeout(resolve, displayDuration * 1000))
                ]);
              } catch (speakError) {
                await new Promise(r => setTimeout(r, displayDuration * 1000));
              }
            } else {
              await new Promise(r => setTimeout(r, displayDuration * 1000));
            }
          } else {
            const displayDuration = warning.duration || 10;
            await new Promise(r => setTimeout(r, displayDuration * 1000));
          }
          
          if (i < activeWarningsList.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (error) {
          console.error('[Display] Erro ao reproduzir aviso:', error);
        }
      }

      setActiveWarning(null);
      warningCycleCompletedRef.current = true;
      warningCycleRunningRef.current = false;
    };

    const checkAndStartCycle = () => {
      if (!isOnDisplayPage) return;
      if (isCalling || isPlayingRef.current) return;
      if (warningCycleRunningRef.current) return;
      if (warningCycleCompletedRef.current) return;
      
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTimeRef.current;
      const isIdle = timeSinceActivity > IDLE_THRESHOLD;
      
      if (!isIdle) return;
      if (lastIdleSessionRef.current === lastActivityTimeRef.current) return;
      
      const activeWarningsList = warnings.filter(isWarningScheduledNow);
      
      if (activeWarningsList.length === 0) {
        warningCycleCompletedRef.current = true;
        lastIdleSessionRef.current = lastActivityTimeRef.current;
        return;
      }
      
      lastIdleSessionRef.current = lastActivityTimeRef.current;
      playAllWarnings(activeWarningsList);
    };
    
    checkAndStartCycle();
    const intervalId = setInterval(checkAndStartCycle, 1000);
    return () => clearInterval(intervalId);
  }, [isOnDisplayPage, audioActivated, warnings, isWarningScheduledNow, isCalling]);

  useEffect(() => {
    if (!audioActivated || nextPatients.length === 0) return;

    const preloadNextPatients = async () => {
      const promises = nextPatients.slice(0, 3).map(async (patient) => {
        try {
          const text = `Chamando ${patient.name}, para ${patient.destination}`;
          await preloadTTS(text);
        } catch (error) {
          console.warn(`[Audio] Falha ao pré-carregar ${patient.name}:`, error);
        }
      });
      await Promise.allSettled(promises);
    };

    const timeout = setTimeout(preloadNextPatients, 1000);
    return () => clearTimeout(timeout);
  }, [nextPatients, audioActivated, preloadTTS]);

  useEffect(() => {
    if (isElectron) {
      updateBadge(nextPatients.length);
    }
  }, [nextPatients, isElectron, updateBadge]);

  // Função isolada para tocar áudio e atualizar estado
  const playBellAndSpeak = useCallback(async (patient: Patient) => {
    if (!isOnDisplayPage) return;
    
    cancelTTS();
    setActiveWarning(null); 
    setLastActivityTime(Date.now());
    newsCycleCompletedRef.current = false;

    if (isPlayingRef.current) return;

    const isDuplicate =
      patient.id === lastCalledRef.current?.id &&
      patient.callCount === lastCalledRef.current?.callCount;

    if (isDuplicate) return;

    isPlayingRef.current = true;
    setIsCalling(true);
    
    await resumeAudioContext();

    try {
      const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;
      const patientWithAudio = patient as Patient & { audio_url?: string };
      
      const bell = new Audio('/bell.mp3');
      bell.volume = 1.0;

      await bell.play();

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          bell.pause();
          bell.onended = null;
          bell.onerror = null;
          bell.src = '';
        };
        bell.onended = () => { cleanup(); resolve(); };
        bell.onerror = () => { cleanup(); resolve(); };
      });

      if (patientWithAudio.audio_url) {
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(patientWithAudio.audio_url);
          audio.volume = 1.0;
          audio.onended = () => resolve();
          audio.onerror = (e) => reject(e);
          audio.play().catch(reject);
        });
      } else {
        await preloadTTS(textToSpeak).catch(() => null);
        await speak(textToSpeak);
      }

      lastCalledRef.current = { id: patient.id, callCount: patient.callCount };
      
      if (isElectron) {
        await sendNotification(
          'Nova Chamada - HealthCall',
          `Chamando ${patient.name} para ${patient.destination}`,
          { patientId: patient.id, destination: patient.destination }
        );
      }
    } catch (error) {
      console.error('[Audio] Erro na chamada:', error);
      toast.error('Erro ao reproduzir áudio da chamada');
    } finally {
      isPlayingRef.current = false;
      setTimeout(() => setIsCalling(false), 500);
      setLastActivityTime(Date.now());
    }
  }, [isOnDisplayPage, resumeAudioContext, cancelTTS, speak, preloadTTS, isElectron, sendNotification]);

  useEffect(() => {
    // IMPORTANTE: Só executa a lógica de dados/listeners quando está na página de display
    // e o áudio está ativado (ou seja, o usuário interagiu)
    if (!audioActivated || !isOnDisplayPage) return;

    const fetchDisplayData = async () => {
      setLastActivityTime(Date.now());
      try {
        const lastCallData = await displayService.getLastCall();
        if (lastCallData) {
          setCalledPatient({
            ...lastCallData.patient,
            destination: lastCallData.location,
            status: 'Chamado' as const,
          });
        }
        setCallHistory(await displayService.getCallHistory());
        setNextPatients(await displayService.getNextPatients());
        
        let warningsData: Warning[] = [];
        if (isElectron) {
            warningsData = await localDb.getActiveWarnings();
        } else {
            warningsData = await syncClient.getActiveWarnings();
        }
        if (warningsData) setWarnings(warningsData);

      } catch (error) {
        console.error('[Display] Error fetching data:', error);
      }
    };

    // Initial fetch
    fetchDisplayData();

    const refetchInterval = setInterval(fetchDisplayData, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchDisplayData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ============================================
    // UNIFIED DATA LISTENER
    // Funciona tanto para IPC (Local) quanto WebSocket (Rede)
    // ============================================
    const handleUnifiedDataUpdate = async (data: { table: string }) => {
      if (!isOnDisplayPage) return;
      
      console.log('[Display] Update received:', data.table);
      
      if (data.table === 'patients' || data.table === 'calls') {
        const lastCall = await displayService.getLastCall();
        if (lastCall) {
          const patient = lastCall.patient;
          const isNewCall = 
            patient.id !== lastProcessedCallRef.current.id ||
            patient.callCount !== lastProcessedCallRef.current.callCount;
          
          if (isNewCall) {
            lastProcessedCallRef.current = { id: patient.id, callCount: patient.callCount };
            playBellAndSpeak({
              ...patient,
              destination: lastCall.location,
              status: 'Chamado' as const,
            });
          }
        }
        fetchDisplayData();
      }
      
      if (data.table === 'warnings') {
        fetchDisplayData();
      }
    };

    // Registrar listeners
    if (isElectron) {
        localDb.onDataUpdate(handleUnifiedDataUpdate);
    } else {
        syncClient.on('data_update', handleUnifiedDataUpdate);
    }

    return () => {
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (isElectron) {
          localDb.offDataUpdate(handleUnifiedDataUpdate);
      } else {
          syncClient.off('data_update', handleUnifiedDataUpdate);
      }
    };
  }, [audioActivated, isOnDisplayPage, isElectron, playBellAndSpeak]);

  return {
    calledPatient,
    nextPatients,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
    isActivatingAudio,
    activeWarning,
    shouldShowHeadline,
    handleNewsCycleComplete,
    handleVideoEnd,
    isOnDisplayPage,
  };
}

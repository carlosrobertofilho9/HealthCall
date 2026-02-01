import { useState, useEffect, useRef } from 'react';
import { Patient, CallRecord, Warning } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { useAudioContext } from '@/hooks/useAudioContext';
import { audioMonitoring } from '@/lib/audioMonitoring';
import { useElectron } from '@/hooks/useElectron';

/**
 * Um hook para gerenciar toda a lógica e estado da página de exibição pública.
 */
export function useDisplay() {
  const { session } = useAuth();
  const { speak, preloadTTS, cancel: cancelTTS } = useTextToSpeech();
  const { contextRef: audioContextRef, isHealthy, resume: resumeAudioContext, startHealthCheck } = useAudioContext();
  const { isElectron, sendNotification, updateBadge } = useElectron();
  
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  
  // Warning System State
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activeWarning, setActiveWarning] = useState<Warning | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const lastWarningIndexRef = useRef<number>(-1);
  const lastWarningIdRef = useRef<string | null>(null);
  const lastWarningEndTimeRef = useRef<number>(0);
  const warningCycleCompletedRef = useRef<boolean>(false);
  const lastIdleSessionRef = useRef<number>(0);
  const warningCycleRunningRef = useRef<boolean>(false);
  
  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);
  const isPlayingRef = useRef(false); // Indicates if a PATIENT CALL is playing
  const newsCycleCompletedRef = useRef<boolean>(false);

  const IDLE_THRESHOLD = 3000; // 3 seconds

  const isWarningScheduledNow = (warning: Warning) => {
    if (!warning.active) return false;
    // If no schedule set, it's valid
    if (!warning.start_time || !warning.end_time) return true;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    try {
        const [startHour, startMinute] = warning.start_time.split(':').map(Number);
        const [endHour, endMinute] = warning.end_time.split(':').map(Number);

        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;

        if (endTotal < startTotal) {
            // Over midnight (e.g. 23:00 to 02:00)
            return currentMinutes >= startTotal || currentMinutes <= endTotal;
        }

        return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } catch (e) {
        console.error("Error parsing warning schedule", e);
        return true; // Fallback to valid if parse fails
    }
  };

  const activateAudio = async () => {
    if (isActivatingAudio) return;

    setIsActivatingAudio(true);
    const startTime = Date.now();

    try {
      await resumeAudioContext();
      const bell = new Audio('/bell.mp3');
      bell.crossOrigin = 'anonymous';
      bell.preload = 'auto';
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
      startHealthCheck(30000);
      audioMonitoring.start();
      audioTelemetry.trackActivation(true, Date.now() - startTime);
      toast.success('Sistema de áudio ativado');
    } catch (error) {
      console.error('[Audio] Falha na ativação:', error);
      audioTelemetry.trackActivation(false, Date.now() - startTime);
      toast.error('Falha ao ativar áudio');
      setAudioActivated(false);
    } finally {
      setIsActivatingAudio(false);
    }
  };

  const handleNewsCycleComplete = () => {
    console.log('[Display] Ciclo de notícias finalizado - voltando para fila');
    newsCycleCompletedRef.current = true;
    // Reset activity time to force return to queue
    setLastActivityTime(0);
  };


  // Warning Cycle Logic - Simplified
  useEffect(() => {
    if (!audioActivated || isCalling || warnings.length === 0) {
      if (activeWarning) setActiveWarning(null);
      warningCycleCompletedRef.current = false;
      warningCycleRunningRef.current = false;
      return;
    }

    // Check immediately if there are scheduled warnings
    const activeWarningsList = warnings.filter(isWarningScheduledNow);
    
    // If no warnings are scheduled, mark cycle as complete immediately
    if (activeWarningsList.length === 0) {
      console.log('[Display] Nenhum aviso agendado - manchete permitida imediatamente');
      warningCycleCompletedRef.current = true;
      warningCycleRunningRef.current = false;
      return;
    }

    // Don't restart cycle if already completed or currently running
    if (warningCycleCompletedRef.current || warningCycleRunningRef.current) {
      return;
    }

    const playAllWarnings = async () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const isIdle = timeSinceActivity > IDLE_THRESHOLD;

      // Only start new cycle if entering a new idle session
      if (isIdle && lastIdleSessionRef.current !== lastActivityTime) {
        console.log('[Display] Nova sessão idle - iniciando ciclo de avisos');
        lastIdleSessionRef.current = lastActivityTime;
        warningCycleCompletedRef.current = false;
        warningCycleRunningRef.current = true; // Mark as running
        


        // Play all warnings in sequence
        for (let i = 0; i < activeWarningsList.length; i++) {
          const warning = activeWarningsList[i];
          
          // Check if we should stop (e.g., new patient call)
          if (isPlayingRef.current) {
            console.log('[Display] Ciclo de avisos interrompido por chamada');
            warningCycleRunningRef.current = false;
            break;
          }

          console.log(`[Display] Aviso ${i + 1}/${activeWarningsList.length}: ${warning.text}`);
          setActiveWarning(warning);

          try {
            await speak(warning.text);
            // Small pause between warnings (1 second)
            await new Promise(r => setTimeout(r, 1000));
          } catch (error) {
            console.error('[Display] Erro ao reproduzir aviso:', error);
          } finally {
            setActiveWarning(null);
          }
        }

        // All warnings played - mark cycle as complete
        console.log('[Display] Ciclo de avisos completo - manchete pode aparecer');
        warningCycleCompletedRef.current = true;
        warningCycleRunningRef.current = false;
        lastWarningEndTimeRef.current = Date.now();
      }
    };

    playAllWarnings();
  }, [audioActivated, isCalling, warnings, lastActivityTime, speak, isWarningScheduledNow]);


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

  // Update tray badge with pending patients count (Electron only)
  useEffect(() => {
    if (isElectron) {
      updateBadge(nextPatients.length);
    }
  }, [nextPatients, isElectron, updateBadge]);

  useEffect(() => {
    if (!session || !audioActivated) return;

    const playBellAndSpeak = async (patient: Patient) => {
      // Intercept any playing warning
      cancelTTS();
      setActiveWarning(null); 
      setLastActivityTime(Date.now()); // Reset idle timer
      newsCycleCompletedRef.current = false; // Reset news cycle for next idle session

      // Mutex for Patient Calls
      if (isPlayingRef.current) {
        return;
      }

      const isDuplicate =
        patient.id === lastCalledRef.current?.id &&
        patient.callCount === lastCalledRef.current?.callCount;

      if (isDuplicate) return;

      isPlayingRef.current = true;
      setIsCalling(true);
      
      await resumeAudioContext();

      try {
        const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;
        const preloadPromise = preloadTTS(textToSpeak).catch(() => null);

        const bell = new Audio('/bell.mp3');
        bell.crossOrigin = 'anonymous';
        bell.preload = 'auto';
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
          bell.onerror = () => { cleanup(); resolve(); }; // Continue even if bell fails
        });

        await preloadPromise;
        await speak(textToSpeak);

        lastCalledRef.current = { id: patient.id, callCount: patient.callCount };
        
        // Send Electron notification if running in desktop app
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
    };

    const fetchDisplayData = async () => {
      setLastActivityTime(Date.now()); // Reset idle on data refresh
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
        
        // Fetch warnings
        const { data: warningsData } = await supabase
            .from('warnings')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });
        if (warningsData) setWarnings(warningsData);

      } catch (error) {}
    };

    fetchDisplayData();

    const refetchInterval = setInterval(fetchDisplayData, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchDisplayData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase
      .channel('realtime-display-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchDisplayData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warnings' }, fetchDisplayData) // Listen to warnings
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
        if (status === 'SUBSCRIBED') fetchDisplayData();
      });

    return () => {
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [session, audioActivated]);

  // Calculate if we should show news headline
  // Headline shows when: idle for 3s+, no active warning, not calling, warning cycle completed, and news cycle not completed yet
  const shouldShowHeadline = 
    !isCalling && 
    !activeWarning && 
    audioActivated &&
    (Date.now() - lastActivityTime > IDLE_THRESHOLD) &&
    (warnings.filter(isWarningScheduledNow).length === 0 || warningCycleCompletedRef.current) &&
    !newsCycleCompletedRef.current;

  return {
    calledPatient,
    nextPatients,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
    isActivatingAudio,
    activeWarning, // Export activeWarning
    shouldShowHeadline, // Export headline state
    handleNewsCycleComplete, // Export news cycle completion handler
  };
}

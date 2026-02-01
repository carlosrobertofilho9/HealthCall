import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Patient, CallRecord, Warning } from '@/types';
import * as displayService from '@/features/display/services/displayService';
import * as localDb from '@/services/localDatabase';
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
  const videoEndResolverRef = useRef<(() => void) | null>(null);
  
  const [audioActivated, setAudioActivated] = useState(false);
  const [isActivatingAudio, setIsActivatingAudio] = useState(false);
  const lastCalledRef = useRef<{ id: string; callCount: number } | null>(null);
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
  // APENAS NA PÁGINA DE DISPLAY
  useEffect(() => {
    if (!isOnDisplayPage) return;
    
    if (isElectron && !audioActivated) {
      console.log('[Display] Electron detectado - ativando áudio automaticamente');
      // Ativa automaticamente sem precisar de interação do usuário
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
    console.log('[Display] handleVideoEnd chamado, resolver existe:', !!videoEndResolverRef.current);
    if (videoEndResolverRef.current) {
      console.log('[Display] Resolvendo promise do vídeo');
      const resolver = videoEndResolverRef.current;
      videoEndResolverRef.current = null;
      resolver();
    } else {
      console.log('[Display] Nenhum resolver configurado - ignorando');
    }
  }, []);

  const isWarningScheduledNow = useCallback((warning: Warning) => {
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
      setLastActivityTime(Date.now()); // Reset para mostrar lista de atendimento primeiro
      warningCycleCompletedRef.current = false; // Reset do ciclo de avisos
      warningCycleRunningRef.current = false;
      lastIdleSessionRef.current = 0; // Reset para permitir novo ciclo
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
    console.log('[Display] Ciclo de notícias finalizado - voltando para fila');
    newsCycleCompletedRef.current = true;
    setShouldShowHeadline(false);
  }, []);


  // Effect to manage shouldShowHeadline state based on conditions
  // APENAS NA PÁGINA DE DISPLAY
  useEffect(() => {
    if (!isOnDisplayPage) return;
    
    const checkHeadlineConditions = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const isIdle = timeSinceActivity > IDLE_THRESHOLD;
      const activeWarningsList = warnings.filter(isWarningScheduledNow);
      
      // Avisos completos quando: não há avisos agendados OU ciclo já foi concluído
      // E também não há ciclo em execução
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
        console.log('[Display] Condições atendidas - mostrando notícias (avisos concluídos)');
        setShouldShowHeadline(true);
      } else if (!canShowHeadline && shouldShowHeadline && !newsCycleCompletedRef.current) {
        // Only hide if not in middle of news cycle (unless news cycle completed)
        if (isCalling || activeWarning || warningCycleRunningRef.current) {
          console.log('[Display] Interrupção por chamada/aviso - escondendo notícias');
          setShouldShowHeadline(false);
        }
      }
    };

    // Check immediately
    checkHeadlineConditions();

    // Set up interval to check periodically
    const interval = setInterval(checkHeadlineConditions, 1000);
    
    return () => clearInterval(interval);
  }, [isOnDisplayPage, isCalling, activeWarning, audioActivated, lastActivityTime, warnings, shouldShowHeadline]);

  // Refs para evitar re-execução do useEffect durante o ciclo
  const speakRef = useRef(speak);
  const lastActivityTimeRef = useRef(lastActivityTime);
  
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);
  
  useEffect(() => {
    lastActivityTimeRef.current = lastActivityTime;
  }, [lastActivityTime]);

  // Warning Cycle Logic - Com intervalo de verificação para iniciar ciclo
  // APENAS NA PÁGINA DE DISPLAY
  useEffect(() => {
    if (!isOnDisplayPage) return;
    
    if (!audioActivated || warnings.length === 0) {
      warningCycleCompletedRef.current = false;
      warningCycleRunningRef.current = false;
      return;
    }

    const playAllWarnings = async (activeWarningsList: Warning[]) => {
      // Verificação adicional: sair se não estiver na página de display
      if (!isOnDisplayPage) {
        console.log('[Display] Não está na página de display - abortando ciclo de avisos');
        warningCycleRunningRef.current = false;
        return;
      }
      
      // Double-check mutex antes de começar (evita race condition)
      if (warningCycleRunningRef.current) {
        console.log('[Display] Mutex ativo - ciclo já em execução');
        return;
      }
      
      // Ativar mutex IMEDIATAMENTE antes de qualquer operação assíncrona
      warningCycleRunningRef.current = true;
      
      console.log('[Display] Iniciando ciclo de avisos');
      console.log(`[Display] Total de avisos para reproduzir: ${activeWarningsList.length}`);
      activeWarningsList.forEach((w, idx) => {
        console.log(`[Display] Aviso ${idx + 1}: tipo=${w.media_type}, texto="${w.text?.substring(0, 30)}..."`);
      });
      
      warningCycleCompletedRef.current = false;

      // Play all warnings in sequence - um por vez
      for (let i = 0; i < activeWarningsList.length; i++) {
        const warning = activeWarningsList[i];
        
        // Check if we should stop (e.g., new patient call)
        if (isPlayingRef.current) {
          console.log('[Display] Ciclo de avisos interrompido por chamada de paciente');
          warningCycleRunningRef.current = false;
          return; // Sai completamente sem marcar como completo
        }

        console.log(`[Display] Iniciando aviso ${i + 1}/${activeWarningsList.length}: tipo=${warning.media_type}, texto="${warning.text}"`);
        
        // Definir o próximo aviso diretamente (sem limpar antes para evitar flash)
        setActiveWarning(warning);

        try {
          const isLocalVideo = warning.media_type === 'video';
          const isYouTube = warning.media_type === 'youtube';
          const isImage = !warning.media_type || warning.media_type === 'image';
          
          if (isLocalVideo) {
            // Para vídeos locais, aguarda o evento onended do vídeo
            console.log(`[Display] Reproduzindo vídeo local até o final`);
            
            // Limpa qualquer resolver anterior
            videoEndResolverRef.current = null;
            
            // Cria uma promise que será resolvida quando o vídeo terminar
            await new Promise<void>((resolve) => {
              // Pequeno delay para garantir que o componente foi montado
              setTimeout(() => {
                videoEndResolverRef.current = resolve;
                console.log('[Display] Resolver de vídeo configurado - aguardando fim');
              }, 500);
              
              // Timeout de segurança de 5 minutos para evitar travamento
              setTimeout(() => {
                console.log('[Display] Timeout de segurança - avançando para próximo aviso');
                if (videoEndResolverRef.current === resolve) {
                  resolve();
                  videoEndResolverRef.current = null;
                }
              }, 5 * 60 * 1000);
            });
            
            console.log(`[Display] Vídeo local finalizado`);
          } else if (isYouTube) {
            // Para YouTube, usa a duração especificada (obrigatório para YouTube)
            const videoDuration = warning.duration || 30;
            console.log(`[Display] Reproduzindo YouTube por ${videoDuration} segundos`);
            await new Promise(r => setTimeout(r, videoDuration * 1000));
          } else if (isImage) {
            // Para imagens/texto, usa o áudio pré-gerado se disponível
            const displayDuration = warning.duration || 15; // Duração padrão de 15s para imagens
            
            if (warning.audio_url) {
              // Usa o áudio TTS pré-gerado
              console.log(`[Display] Reproduzindo áudio pré-gerado: ${warning.audio_url}`);
              try {
                const audio = new Audio(warning.audio_url);
                audio.volume = 1.0;
                
                await Promise.race([
                  new Promise<void>((resolve, reject) => {
                    audio.onended = () => {
                      console.log('[Display] Áudio pré-gerado concluído');
                      resolve();
                    };
                    audio.onerror = (e) => {
                      console.error('[Display] Erro ao reproduzir áudio pré-gerado:', e);
                      reject(e);
                    };
                    audio.play().catch(reject);
                  }),
                  new Promise<void>((resolve) => setTimeout(resolve, displayDuration * 1000))
                ]);
              } catch (audioError) {
                console.error('[Display] Erro ao reproduzir áudio pré-gerado:', audioError);
                // Aguarda o tempo mínimo mesmo se o áudio falhar
                await new Promise(r => setTimeout(r, displayDuration * 1000));
              }
            } else if (warning.text) {
              // Fallback: tenta gerar TTS na hora (caso o áudio ainda não tenha sido gerado)
              console.log(`[Display] Sem áudio pré-gerado, tentando TTS ao vivo: "${warning.text}"`);
              try {
                await Promise.race([
                  speakRef.current(warning.text),
                  new Promise<void>((resolve) => setTimeout(resolve, displayDuration * 1000))
                ]);
                console.log(`[Display] Texto do aviso ${i + 1} concluído`);
              } catch (speakError) {
                console.error('[Display] Erro ao falar texto do aviso:', speakError);
                await new Promise(r => setTimeout(r, displayDuration * 1000));
              }
            } else {
              // Se não há texto nem áudio, apenas exibe a imagem pelo tempo determinado
              console.log(`[Display] Exibindo imagem por ${displayDuration} segundos`);
              await new Promise(r => setTimeout(r, displayDuration * 1000));
            }
          } else {
            // Fallback para qualquer outro tipo
            const displayDuration = warning.duration || 10;
            console.log(`[Display] Tipo desconhecido - exibindo por ${displayDuration} segundos`);
            await new Promise(r => setTimeout(r, displayDuration * 1000));
          }
          
          // Pequena pausa entre avisos (sem limpar a tela)
          // O próximo aviso será definido diretamente no início do loop
          if (i < activeWarningsList.length - 1) {
            console.log(`[Display] Pausa de 1s antes do próximo aviso`);
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (error) {
          console.error('[Display] Erro ao reproduzir aviso:', error);
        }
      }

      // All warnings played - mark cycle as complete
      console.log('[Display] Ciclo de avisos COMPLETO - todas as notícias agora podem aparecer');
      setActiveWarning(null);
      warningCycleCompletedRef.current = true;
      warningCycleRunningRef.current = false;
      lastWarningEndTimeRef.current = Date.now();
    };

    // Função que verifica se deve iniciar o ciclo
    const checkAndStartCycle = () => {
      // Se não está na página de display, não fazer nada
      if (!isOnDisplayPage) {
        return;
      }
      
      // Se está chamando paciente, não fazer nada
      if (isCalling || isPlayingRef.current) {
        return;
      }
      
      // Se já está rodando, não fazer nada
      if (warningCycleRunningRef.current) {
        return;
      }
      
      // Se já completou nesta sessão idle, não reiniciar
      if (warningCycleCompletedRef.current) {
        return;
      }
      
      // Verificar se está idle
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTimeRef.current;
      const isIdle = timeSinceActivity > IDLE_THRESHOLD;
      
      if (!isIdle) {
        return;
      }
      
      // Verificar se é uma nova sessão idle (atividade mudou desde último ciclo)
      // Só bloqueia se já iniciamos um ciclo para esta sessão
      if (lastIdleSessionRef.current === lastActivityTimeRef.current) {
        return;
      }
      
      // Get active warnings
      const activeWarningsList = warnings.filter(isWarningScheduledNow);
      
      if (activeWarningsList.length === 0) {
        console.log('[Display] Nenhum aviso agendado - permitindo notícias');
        warningCycleCompletedRef.current = true;
        lastIdleSessionRef.current = lastActivityTimeRef.current;
        return;
      }
      
      // Marcar esta sessão idle
      lastIdleSessionRef.current = lastActivityTimeRef.current;
      
      // Iniciar ciclo
      console.log('[Display] Nova sessão idle detectada - iniciando ciclo de avisos');
      console.log(`[Display] Avisos ativos: ${activeWarningsList.map(w => w.text?.substring(0, 20)).join(', ')}`);
      playAllWarnings(activeWarningsList);
    };
    
    // Verificar imediatamente e depois a cada segundo
    checkAndStartCycle();
    const intervalId = setInterval(checkAndStartCycle, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
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

  // Update tray badge with pending patients count (Electron only)
  useEffect(() => {
    if (isElectron) {
      updateBadge(nextPatients.length);
    }
  }, [nextPatients, isElectron, updateBadge]);

  useEffect(() => {
    // IMPORTANTE: Só executa a lógica de áudio quando está na página de display
    if (!audioActivated || !isOnDisplayPage) return;

    const playBellAndSpeak = async (patient: Patient) => {
      // Verificação adicional: não tocar se não estiver na página de display
      if (!isOnDisplayPage) {
        console.log('[Display] Não está na página de display - ignorando chamada de áudio');
        return;
      }
      
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
        
        // Verifica se tem áudio pré-gerado
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
          bell.onerror = () => { cleanup(); resolve(); }; // Continue even if bell fails
        });

        // Usa áudio pré-gerado se disponível, senão usa TTS
        if (patientWithAudio.audio_url) {
          console.log(`[Display] Reproduzindo áudio pré-gerado do paciente: ${patientWithAudio.audio_url}`);
          await new Promise<void>((resolve, reject) => {
            const audio = new Audio(patientWithAudio.audio_url);
            audio.volume = 1.0;
            audio.onended = () => resolve();
            audio.onerror = (e) => {
              console.error('[Display] Erro no áudio pré-gerado:', e);
              reject(e);
            };
            audio.play().catch(reject);
          });
        } else {
          // Fallback para TTS em tempo real
          console.log('[Display] Áudio pré-gerado não disponível, usando TTS');
          await preloadTTS(textToSpeak).catch(() => null);
          await speak(textToSpeak);
        }

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
        
        // Fetch warnings from local database
        const warningsData = await localDb.getActiveWarnings();
        if (warningsData) setWarnings(warningsData);

      } catch (error) {
        console.error('[Display] Error fetching data:', error);
      }
    };

    fetchDisplayData();

    const refetchInterval = setInterval(fetchDisplayData, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchDisplayData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Ref to track the last call we processed to detect new calls
    const lastProcessedCallRef = { id: '', callCount: 0 };

    // Listen for data updates via IPC (replaces Supabase Realtime)
    const handleDataUpdate = async (data: { table: string }) => {
      // Verificação: não processar eventos de áudio se não estiver na página de display
      if (!isOnDisplayPage) {
        console.log('[Display] Ignorando atualização - não está na página de display');
        return;
      }
      
      console.log('[Display] Data update received:', data.table);
      
      if (data.table === 'patients' || data.table === 'calls') {
        // Check for new calls
        const lastCall = await displayService.getLastCall();
        if (lastCall) {
          const patient = lastCall.patient;
          const isNewCall = 
            patient.id !== lastProcessedCallRef.id ||
            patient.callCount !== lastProcessedCallRef.callCount;
          
          if (isNewCall) {
            lastProcessedCallRef.id = patient.id;
            lastProcessedCallRef.callCount = patient.callCount;
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

    // Register IPC listener
    localDb.onDataUpdate(handleDataUpdate);

    return () => {
      clearInterval(refetchInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      localDb.offDataUpdate(handleDataUpdate);
    };
  }, [audioActivated, isOnDisplayPage]);

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
    handleVideoEnd, // Export video end handler para WarningOverlay
    isOnDisplayPage, // Export flag para indicar se está na página de display
  };
}

import React, { useState, useEffect, useRef } from 'react';
import { useWarnings } from '@/features/warnings/hooks/useWarnings';
import { Warning } from '@/features/warnings/types';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface WarningPlayerProps {
  onFinish: () => void;
}

export const WarningPlayer: React.FC<WarningPlayerProps> = ({ onFinish }) => {
  const { warnings } = useWarnings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeWarnings, setActiveWarnings] = useState<Warning[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().toTimeString().slice(0, 5));
  const [playTrigger, setPlayTrigger] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { speak, cancel: cancelTTS } = useTextToSpeech();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Atualiza hora atual a cada minuto para o agendamento
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toTimeString().slice(0, 5);
      if (now !== currentTime) {
        setCurrentTime(now);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [currentTime]);

  // Cleanup ao desmontar - para vídeo e TTS imediatamente
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      console.log('[WarningPlayer] Desmontando, parando mídia...');
      
      // Cancela TTS
      cancelTTS();
      
      // Para o vídeo
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      
      // Limpa timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [cancelTTS]);

  // Filter active warnings based on status and time
  useEffect(() => {
    console.log('[WarningPlayer] Filtrando warnings. Total:', warnings.length, 'Hora atual:', currentTime);

    const valid = warnings.filter(w => {
      if (!w.active) {
        return false;
      }
      if (!w.content_url) {
        return false;
      }
      
      const dbStart = w.start_time ? w.start_time.slice(0, 5) : null;
      const dbEnd = w.end_time ? w.end_time.slice(0, 5) : null;

      if (dbStart && dbStart > currentTime) {
        return false;
      }
      if (dbEnd && dbEnd < currentTime) {
        return false;
      }
      
      return true;
    });
    
    // Ordena por prioridade (priority=true primeiro) e depois por priority_order
    const sorted = valid.sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return (a.priority_order || 0) - (b.priority_order || 0);
    });
    
    console.log('[WarningPlayer] Warnings válidos:', sorted.length);
    setActiveWarnings(sorted);
    
    // Reset index if valid warnings changed
    setCurrentIndex(prev => (prev >= sorted.length ? 0 : prev));
  }, [warnings, currentTime]);

  useEffect(() => {
    if (activeWarnings.length === 0) return;

    const currentWarning = activeWarnings[currentIndex];
    console.log('[WarningPlayer] Reproduzindo:', currentWarning.text, '(Index:', currentIndex, ')');

    // Image/YouTube Playback Logic - usa duration
    const playWithDuration = async () => {
      // If there's a message, speak it and wait
      if (currentWarning.message) {
        try {
          await speak(currentWarning.message);
          if (!isMountedRef.current) return;
          // Espera 1s após o TTS antes de passar para o próximo
          timeoutRef.current = setTimeout(handleNext, 1000); 
        } catch (e) {
          console.error('TTS Error, falling back to timer:', e);
          if (!isMountedRef.current) return;
          timeoutRef.current = setTimeout(handleNext, 5000);
        }
      } else {
        const durationMs = (currentWarning.duration || 10) * 1000;
        timeoutRef.current = setTimeout(handleNext, durationMs);
      }
    };
    
    // Para imagem e youtube, usa o timer de duração
    if (currentWarning.media_type === 'image' || currentWarning.media_type === 'youtube') {
       playWithDuration();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, activeWarnings, playTrigger, speak]);

  const handleNext = () => {
    if (!isMountedRef.current) return;
    if (activeWarnings.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % activeWarnings.length;
    
    if (nextIndex === 0) {
      onFinish(); 
    }
    
    setCurrentIndex(nextIndex);
    // Incrementa o trigger para garantir que o efeito de playback rode mesmo se o index for o mesmo (ex: 1 item na lista)
    setPlayTrigger(prev => prev + 1);
  };

  const currentWarning = activeWarnings[currentIndex];

  // Extrai o ID do vídeo do YouTube da URL
  const getYoutubeEmbedUrl = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0` : '';
  };

  if (!currentWarning) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black flex items-center justify-center animate-in fade-in duration-500">
      {currentWarning.media_type === 'video' && currentWarning.content_url ? (
        <video
          key={`${currentWarning.id}-${playTrigger}`}
          ref={videoRef}
          src={currentWarning.content_url}
          className="w-full h-full object-contain"
          autoPlay
          onEnded={handleNext}
          onError={(e) => {
             console.error('Video Error', e);
             handleNext();
          }}
        />
      ) : currentWarning.media_type === 'youtube' && currentWarning.content_url ? (
        <iframe
          key={`${currentWarning.id}-${playTrigger}`}
          src={getYoutubeEmbedUrl(currentWarning.content_url)}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : currentWarning.content_url ? (
        <div key={`${currentWarning.id}-${playTrigger}`} className="relative w-full h-full">
           <img
             src={currentWarning.content_url}
             alt={currentWarning.text}
             className="w-full h-full object-cover opacity-80"
           />
           {currentWarning.message && (
             <div className="absolute bottom-20 left-0 right-0 p-8 text-center bg-black/60 backdrop-blur-sm">
               <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg leading-tight">
                 {currentWarning.message}
               </h2>
             </div>
           )}
        </div>
      ) : (
        <div key={`${currentWarning.id}-${playTrigger}`} className="relative w-full h-full flex items-center justify-center">
          {currentWarning.message && (
            <div className="p-8 text-center">
              <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg leading-tight">
                {currentWarning.message}
              </h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

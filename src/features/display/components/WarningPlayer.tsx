import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { speak, cancel: cancelTTS } = useTextToSpeech();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasSpokeRef = useRef(false); // Controla se já falou para o warning atual
  const lastWarningIdRef = useRef<string | null>(null);

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

  // Cleanup ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cancelTTS();
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cancelTTS]);

  // Filter active warnings based on status and time
  useEffect(() => {
    const valid = warnings.filter(w => {
      if (!w.active) return false;
      if (!w.content_url && !w.message) return false;
      
      const dbStart = w.start_time ? w.start_time.slice(0, 5) : null;
      const dbEnd = w.end_time ? w.end_time.slice(0, 5) : null;

      if (dbStart && dbStart > currentTime) return false;
      if (dbEnd && dbEnd < currentTime) return false;
      
      return true;
    });
    
    const sorted = [...valid].sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return (a.priority_order || 0) - (b.priority_order || 0);
    });
    
    setActiveWarnings(sorted);
    setCurrentIndex(prev => (prev >= sorted.length ? 0 : prev));
  }, [warnings, currentTime]);

  const handleNext = useCallback(() => {
    if (!isMountedRef.current || activeWarnings.length === 0) return;
    
    cancelTTS();
    hasSpokeRef.current = false;
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      const nextIndex = (currentIndex + 1) % activeWarnings.length;
      if (nextIndex === 0) {
        onFinish();
      }
      setCurrentIndex(nextIndex);
      setIsTransitioning(false);
    }, 300);
  }, [activeWarnings.length, currentIndex, onFinish, cancelTTS]);

  // Efeito principal de reprodução - SEM speak nas dependências
  useEffect(() => {
    if (activeWarnings.length === 0 || isTransitioning) return;

    const currentWarning = activeWarnings[currentIndex];
    if (!currentWarning) return;

    // Reset hasSpokeRef quando muda o warning
    if (lastWarningIdRef.current !== currentWarning.id) {
      hasSpokeRef.current = false;
      lastWarningIdRef.current = currentWarning.id;
    }

    // Limpa timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const playWarning = async () => {
      const durationMs = (currentWarning.duration || 10) * 1000;

      // Fala a mensagem apenas uma vez
      if (currentWarning.message && !hasSpokeRef.current) {
        hasSpokeRef.current = true;
        try {
          await speak(currentWarning.message);
          if (!isMountedRef.current) return;
          timeoutRef.current = setTimeout(handleNext, 1500);
        } catch (e) {
          console.error('TTS Error:', e);
          if (!isMountedRef.current) return;
          timeoutRef.current = setTimeout(handleNext, durationMs);
        }
      } else if (!currentWarning.message) {
        timeoutRef.current = setTimeout(handleNext, durationMs);
      }
    };
    
    // Para imagem e youtube, usa timer
    if (currentWarning.media_type === 'image' || currentWarning.media_type === 'youtube') {
      playWarning();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentIndex, activeWarnings, isTransitioning, handleNext]);

  const currentWarning = activeWarnings[currentIndex];

  const getYoutubeEmbedUrl = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1` : '';
  };

  if (!currentWarning) return null;

  return (
    <div className={`absolute inset-0 z-40 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        {currentWarning.media_type === 'video' && currentWarning.content_url ? (
          <video
            key={currentWarning.id}
            ref={videoRef}
            src={currentWarning.content_url}
            className="w-full h-full object-contain rounded-2xl shadow-2xl"
            autoPlay
            onEnded={handleNext}
            onError={() => handleNext()}
          />
        ) : currentWarning.media_type === 'youtube' && currentWarning.content_url ? (
          <div className="w-full h-full max-w-6xl mx-auto flex flex-col">
            <iframe
              key={currentWarning.id}
              src={getYoutubeEmbedUrl(currentWarning.content_url)}
              className="w-full flex-1 rounded-2xl shadow-2xl"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            {currentWarning.message && (
              <div className="mt-6 text-center">
                <p className="text-2xl md:text-3xl text-white/90 font-medium">
                  {currentWarning.message}
                </p>
              </div>
            )}
          </div>
        ) : currentWarning.content_url ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Imagem com overlay elegante */}
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
              <img
                key={currentWarning.id}
                src={currentWarning.content_url}
                alt={currentWarning.text || 'Aviso'}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
              
              {/* Card de mensagem sobreposto */}
              {currentWarning.message && (
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm rounded-b-2xl p-8 -mx-0">
                    <p className="text-3xl md:text-5xl font-bold text-white text-center leading-tight drop-shadow-lg">
                      {currentWarning.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Aviso apenas com mensagem (sem mídia) - Design moderno */
          <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-8">
            {/* Ícone decorativo */}
            <div className="mb-8 relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="material-symbols-outlined text-5xl text-white">campaign</span>
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-green-500/20 rounded-full animate-ping" />
            </div>
            
            {/* Título */}
            {currentWarning.text && (
              <h2 className="text-2xl md:text-3xl font-semibold text-green-400 mb-6 tracking-wide uppercase">
                {currentWarning.text}
              </h2>
            )}
            
            {/* Mensagem principal */}
            {currentWarning.message && (
              <p className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                {currentWarning.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Indicador de progresso e navegação */}
      {activeWarnings.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {activeWarnings.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'w-8 bg-green-500 shadow-lg shadow-green-500/50' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Badge de prioridade */}
      {currentWarning.priority && (
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg">
          <span className="material-symbols-outlined text-lg">star</span>
          IMPORTANTE
        </div>
      )}
    </div>
  );
};

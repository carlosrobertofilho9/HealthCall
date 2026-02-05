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
    <div className={`absolute inset-0 z-40 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Padrão de fundo animado */}
      <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />
      
      {/* Background Glows Dinâmicos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
      </div>

      {/* Conteúdo principal com Container Glassmorphism */}
      <div className="relative w-full h-full flex items-center justify-center p-8 md:p-12">
        <div className="relative w-full h-full max-w-[1920px] mx-auto flex flex-col items-center justify-center">
        
        {currentWarning.media_type === 'video' && currentWarning.content_url ? (
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/50 backdrop-blur-sm">
            <video
              key={currentWarning.id}
              ref={videoRef}
              src={currentWarning.content_url}
              className="w-full h-full object-contain"
              autoPlay
              onEnded={handleNext}
              onError={() => handleNext()}
            />
          </div>
        ) : currentWarning.media_type === 'youtube' && currentWarning.content_url ? (
          <div className="w-full h-full max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
              <iframe
                key={currentWarning.id}
                src={getYoutubeEmbedUrl(currentWarning.content_url)}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            {currentWarning.message && (
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 animate-slide-up">
                <p className="text-3xl md:text-4xl text-white font-medium text-center leading-relaxed">
                  {currentWarning.message}
                </p>
              </div>
            )}
          </div>
        ) : currentWarning.content_url ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Container da Imagem */}
            <div className="relative w-full h-full flex items-center justify-center group overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 z-10" />
              
              {/* Título Estilo Badge Premium (Top Left) */}
              {currentWarning.text && (
                <div className="absolute top-8 left-8 z-30 animate-fade-in-down">
                  <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-xl shadow-2xl transform -skew-x-6 hover:skew-x-0 transition-transform duration-500">
                    <div className="w-2 h-10 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-widest uppercase drop-shadow-lg skew-x-6">
                      {currentWarning.text}
                    </h2>
                  </div>
                </div>
              )}
              <img
                key={currentWarning.id}
                src={currentWarning.content_url}
                alt={currentWarning.text || 'Aviso'}
                className="w-full h-full object-cover shadow-2xl ring-1 ring-white/10"
              />
              
              {/* Overlay de Mensagem Premium */}
              {currentWarning.message && (
                <div className="absolute bottom-6 left-0 right-0 px-6 md:px-12 animate-slide-up z-20">
                  <div className="bg-black/70 backdrop-blur-md border border-white/5 rounded-xl p-6 shadow-2xl">

                     <p className="text-xl md:text-3xl font-bold text-white text-center leading-snug drop-shadow-md">
                       {currentWarning.message}
                     </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Aviso Minimalista de Texto (Design Zen) */
          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-2xl animate-zoom-in">
              {/* Ícone com Glow */}
              <div className="mb-10 relative inline-block">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl rotate-3 flex items-center justify-center shadow-lg transform transition hover:rotate-0 duration-500">
                  <span className="material-symbols-outlined text-6xl text-white drop-shadow-md">campaign</span>
                </div>
              </div>
              
              {/* Título Elegante */}
              {currentWarning.text && (
                <h2 className="text-2xl md:text-3xl font-medium text-green-400 mb-8 tracking-[0.2em] uppercase border-b border-green-500/20 pb-4 inline-block">
                  {currentWarning.text}
                </h2>
              )}
              
              {/* Mensagem Principal */}
              {currentWarning.message && (
                <p className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 leading-tight tracking-tight">
                  {currentWarning.message}
                </p>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer / Barra de Progresso */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-center pointer-events-none">
         {activeWarnings.length > 1 && (
           <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-6 py-3 border border-white/5">
             {activeWarnings.map((_, idx) => (
               <div
                 key={idx}
                 className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                   idx === currentIndex 
                     ? 'w-12 bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                     : 'w-2 bg-white/20'
                 }`}
               />
             ))}
           </div>
         )}
      </div>
      
      {/* Badge de Prioridade Premium */}
      {currentWarning.priority && (
        <div className="absolute top-8 right-8 animate-bounce-gentle">
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black px-6 py-3 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(251,191,36,0.4)] border border-yellow-200/50">
            <span className="material-symbols-outlined text-xl">verified</span>
            <span className="tracking-wider text-xs uppercase">Comunicado Oficial</span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useRef, useEffect, useCallback } from 'react';
import { Warning } from '@/types';
import headerLogo from '@/assets/healthcall-logo-header.png';

interface WarningOverlayProps {
  warning: Warning;
  time?: Date;
  onClose?: () => void;
  isPreview?: boolean;
  onVideoEnd?: () => void;
}

export const WarningOverlay: React.FC<WarningOverlayProps> = ({ warning, time = new Date(), onClose, isPreview = false, onVideoEnd }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const hasEndedRef = useRef(false);
    const warningIdRef = useRef<string | null>(null);
    
    const isYouTube = warning.media_type === 'youtube';
    const isVideo = warning.media_type === 'video';
    const isImage = !warning.media_type || warning.media_type === 'image';

    const getYoutubeEmbedUrl = (url: string) => {
        try {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&loop=0&showinfo=0&modestbranding=1`;
        } catch {
            return '';
        }
    };

    const handleVideoEnded = useCallback(() => {
        console.log(`[WarningOverlay] onEnded disparado para warning ${warning.id}, hasEnded: ${hasEndedRef.current}`);
        if (!hasEndedRef.current && onVideoEnd && !isPreview) {
            hasEndedRef.current = true;
            console.log('[WarningOverlay] Vídeo terminou - notificando callback');
            onVideoEnd();
        }
    }, [onVideoEnd, warning.id, isPreview]);

    // Handle audio end for images
    const handleAudioEnded = useCallback(() => {
        if (!hasEndedRef.current && onVideoEnd && !isPreview) {
            hasEndedRef.current = true;
            console.log('[WarningOverlay] Áudio terminou - notificando callback');
            onVideoEnd();
        }
    }, [onVideoEnd, isPreview]);

    // Reset the ended flag when warning changes
    useEffect(() => {
        if (warningIdRef.current !== warning.id) {
            console.log(`[WarningOverlay] Warning mudou de ${warningIdRef.current} para ${warning.id} - resetando hasEnded`);
            hasEndedRef.current = false;
            warningIdRef.current = warning.id;
        }
    }, [warning.id]);

    return (
      <div className={`bg-gray-900 text-white relative flex flex-col overflow-hidden ${isPreview ? 'h-full w-full rounded-lg' : 'min-h-screen'}`} style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        
        {/* Invisible Audio Player for TTS or other audio */}
        {warning.audio_url && (
             <audio 
                 ref={audioRef}
                 src={warning.audio_url}
                 autoPlay
                 onEnded={handleAudioEnded}
                 onError={(e) => console.error('[WarningOverlay] Erro ao carregar áudio:', e)}
             />
        )}

        {/* Background Media */}
        <div className="absolute inset-0 z-0 bg-black">
            {isImage && warning.background_url && (
                <>
                  {/* Usando tag img para melhor compatibilidade com protocolo local:// */}
                  <img 
                    src={warning.background_url}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                    onLoad={() => console.log('[WarningOverlay] Imagem carregada:', warning.background_url)}
                    onError={(e) => console.error('[WarningOverlay] Erro ao carregar imagem:', warning.background_url, e)}
                  />
                  {/* Overlay escuro sobre a imagem para legibilidade do texto */}
                  <div className="absolute inset-0 bg-black/50" />
                </>
            )}

            {isVideo && warning.background_url && (
                <video 
                    ref={videoRef}
                    src={warning.background_url}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted={false}
                    loop={isPreview}
                    playsInline
                    onEnded={handleVideoEnded}
                    onLoadedData={(e) => {
                        const video = e.currentTarget;
                        // Tenta reproduzir com som
                        video.play().catch((err) => {
                            console.warn('[WarningOverlay] Autoplay com som falhou, tentando muted:', err);
                            video.muted = true;
                            video.play().then(() => {
                                // Tenta desmutar após iniciar
                                setTimeout(() => {
                                    video.muted = false;
                                }, 100);
                            }).catch(e => console.error('[WarningOverlay] Falha ao reproduzir vídeo:', e));
                        });
                    }}
                    onError={(e) => {
                        console.error('[WarningOverlay] Erro ao carregar vídeo:', e, 'URL:', warning.background_url);
                    }}
                />
            )}

            {isYouTube && warning.background_url && (
                <div className="absolute inset-0 pointer-events-none">
                    <iframe
                        src={getYoutubeEmbedUrl(warning.background_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 0 }}
                    />
                    {/* Overlay to prevent interaction */}
                    <div className="absolute inset-0 bg-transparent" />
                </div>
            )}
            
            {/* Fallback pattern if no media */}
            {!warning.background_url && (
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900 via-gray-900 to-black" />
            )}
        </div>

        <div className="relative z-10 flex flex-col flex-grow">
            {!isPreview && (
                <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm gap-2 sm:gap-0">
                    <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center sm:items-start">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tracking-wider">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">
                        {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                    <img src={headerLogo} alt="HealthCall Logo" className="h-6 sm:h-8 w-auto" />
                    <h1 className="text-base sm:text-lg md:text-xl font-bold truncate max-w-[200px] sm:max-w-none">PSF Maria Lucia da Silva</h1>
                    </div>
                </header>
            )}
            
            {isPreview && onClose && (
                <div className="absolute top-4 right-4 z-50">
                    <button 
                        onClick={onClose}
                        className="flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors shadow-lg"
                        aria-label="Fechar pré-visualização"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>
            )}

            <main className="flex-grow flex flex-col justify-center items-center text-center pb-0 relative z-10 px-4 sm:px-8">
                {/* QR Code - Centered, above caption */}
                {warning.qrcode_url && (
                    <div className={`mb-4 sm:mb-8 flex flex-col items-center bg-white/95 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-2xl animate-slide-up backdrop-blur-sm ${isPreview ? 'scale-75' : ''}`}>
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(warning.qrcode_url)}`} 
                            alt="QR Code" 
                            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64" 
                        />
                        <p className="text-gray-900 font-bold mt-2 sm:mt-3 text-xs sm:text-sm uppercase tracking-wide">Leia com seu celular</p>
                    </div>
                )}

                {/* Caption Bar - Now at bottom */}
                {warning.text && (
                    <div className="w-full bg-gradient-to-t from-black via-black/60 to-transparent pt-16 sm:pt-24 md:pt-32 pb-6 sm:pb-8 md:pb-10 px-4 sm:px-6 md:px-8 mt-auto">
                        <div className="max-w-7xl mx-auto text-left">
                            <h2 className={`${isPreview ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'} font-bold text-[#38e07b] mb-1 sm:mb-2 uppercase tracking-wider drop-shadow-md flex items-center gap-2 sm:gap-3`}>
                                <span className={`w-1.5 sm:w-2 ${isPreview ? 'h-4 sm:h-6' : 'h-5 sm:h-6 md:h-8'} bg-[#38e07b] rounded-full inline-block`}></span>
                                Aviso Importante
                            </h2>
                            <p className={`${isPreview ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl'} font-medium leading-tight text-white drop-shadow-lg shadow-black break-words hyphens-auto`}>
                                {warning.text}
                            </p>
                        </div>
                    </div>
                )}
            </main>
            
        </div>
      </div>
    );
};

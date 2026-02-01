import React from 'react';
import { Warning } from '@/types';

interface WarningOverlayProps {
  warning: Warning;
  time?: Date;
  onClose?: () => void;
  isPreview?: boolean;
}

export const WarningOverlay: React.FC<WarningOverlayProps> = ({ warning, time = new Date(), onClose, isPreview = false }) => {
    const isYouTube = warning.media_type === 'youtube';
    const isVideo = warning.media_type === 'video';
    const isImage = !warning.media_type || warning.media_type === 'image';

    const getYoutubeEmbedUrl = (url: string) => {
        try {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&showinfo=0&modestbranding=1`;
        } catch {
            return '';
        }
    };

    return (
      <div className={`bg-gray-900 text-white relative flex flex-col overflow-hidden ${isPreview ? 'h-full w-full rounded-lg' : 'min-h-screen'}`} style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        
        {/* Background Media */}
        <div className="absolute inset-0 z-0 bg-black">
            {isImage && warning.background_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 animate-fade-in"
                  style={{ backgroundImage: `url("${warning.background_url}")` }}
                />
            )}

            {isVideo && warning.background_url && (
                <video 
                    src={warning.background_url}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            )}

            {isYouTube && warning.background_url && (
                <div className="absolute inset-0 pointer-events-none opacity-60">
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
                <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold font-mono tracking-wider">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">
                        {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    </div>
                    <div className="flex items-center gap-3">
                    <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
                    <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
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

            <main className="flex-grow flex flex-col justify-center items-center text-center pb-0 relative z-10">
                {/* QR Code - Centered, above caption */}
                {warning.qrcode_url && (
                    <div className={`mb-8 flex flex-col items-center bg-white/95 p-6 rounded-2xl shadow-2xl animate-slide-up backdrop-blur-sm ${isPreview ? 'scale-75' : ''}`}>
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(warning.qrcode_url)}`} 
                            alt="QR Code" 
                            className="w-48 h-48 md:w-64 md:h-64" 
                        />
                        <p className="text-gray-900 font-bold mt-3 text-sm uppercase tracking-wide">Leia com seu celular</p>
                    </div>
                )}

                {/* Caption Bar - Now at bottom */}
                {warning.text && (
                    <div className="w-full bg-gradient-to-t from-black via-black/60 to-transparent pt-32 pb-10 px-8 mt-auto">
                        <div className="max-w-7xl mx-auto text-left">
                            <h2 className={`${isPreview ? 'text-xl' : 'text-3xl'} font-bold text-[#38e07b] mb-2 uppercase tracking-wider drop-shadow-md flex items-center gap-3`}>
                                <span className={`w-2 ${isPreview ? 'h-6' : 'h-8'} bg-[#38e07b] rounded-full inline-block`}></span>
                                Aviso Importante
                            </h2>
                            <p className={`${isPreview ? 'text-2xl' : 'text-4xl md:text-5xl'} font-medium leading-tight text-white drop-shadow-lg shadow-black`}>
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

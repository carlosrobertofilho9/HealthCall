import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as localDb from '@/services/localDatabase';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface NewsItem {
  title: string;
  description?: string;
  image?: string;
  link?: string;
}

interface NewsHeadlineProps {
  time: Date;
  onCycleComplete?: () => void;
}

export const NewsHeadline: React.FC<NewsHeadlineProps> = ({ time, onCycleComplete }) => {
  const [newsIndex, setNewsIndex] = useState(0);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [cycleCompleted, setCycleCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { speak } = useTextToSpeech();
  const lastSpokenIndexRef = useRef<number>(-1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledCompleteRef = useRef<boolean>(false);

  // Derived state
  const currentNews = allNews[newsIndex];

  // Memoized onCycleComplete to avoid dependency issues
  const handleCycleComplete = useCallback(() => {
    if (!hasCalledCompleteRef.current) {
      hasCalledCompleteRef.current = true;
      console.log('[NewsHeadline] Chamando onCycleComplete');
      onCycleComplete?.();
    }
  }, [onCycleComplete]);

  useEffect(() => {
    fetchNews();
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Rotate news logic
  useEffect(() => {
    if (allNews.length === 0 || cycleCompleted || !currentNews || isTransitioning) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Calculate reading time based on content length
    // Min: 10s, Max: 25s
    const textLength = (currentNews.title?.length || 0) + (currentNews.description?.length || 0);
    const displayTime = Math.min(Math.max(10000, textLength * 50), 25000);

    console.log(`[NewsHeadline] Visualizando notícia ${newsIndex + 1}/${allNews.length} por ${displayTime}ms`);

    timerRef.current = setTimeout(() => {
      const nextIndex = newsIndex + 1;
      
      // If we've shown all news, mark cycle as complete
      if (nextIndex >= allNews.length) {
        console.log('[NewsHeadline] Todas as notícias exibidas - ciclo completo');
        setCycleCompleted(true);
        setIsTransitioning(true);
        
        // Call completion callback after a short delay to show last news
        setTimeout(() => {
          handleCycleComplete();
        }, 3000);
        
        return;
      }
      
      // Move to next news
      setNewsIndex(nextIndex);
    }, displayTime);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [newsIndex, allNews.length, cycleCompleted, currentNews, isTransitioning, handleCycleComplete]);

  // Speak effect
  useEffect(() => {
    if (currentNews && newsIndex !== lastSpokenIndexRef.current) {
      lastSpokenIndexRef.current = newsIndex;
      
      // Speak the headline
      speak(currentNews.title).catch(err => {
        console.error('[NewsHeadline] Erro ao falar manchete:', err);
      });
    }
  }, [newsIndex, currentNews]);

  const fetchNews = async () => {
    try {
      const rssUrl = await localDb.getSetting('rss_url') || 'https://g1.globo.com/dynamo/saude/rss2.xml';

      const data = await localDb.fetchRssFeed(rssUrl);

      if (data?.items && data.items.length > 0) {
        console.log(`[NewsHeadline] ${data.items.length} notícias carregadas.`);
        setAllNews(data.items);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  if (!currentNews) return null;

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm shrink-0 z-20 gap-2 sm:gap-0">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono tracking-wider">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-6 sm:h-8 w-auto" />
          <h1 className="text-base sm:text-lg md:text-xl font-bold truncate max-w-[200px] sm:max-w-none">PSF Maria Lucia da Silva</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative overflow-hidden flex">
        {/* Background if no specific image, otherwise blurred background */}
        <div className="absolute inset-0 z-0">
          {currentNews.image ? (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110"
                style={{ backgroundImage: `url(${currentNews.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
            </>
          ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-green-900/20" />
          )}
        </div>

        <div className="relative z-10 w-full h-full flex flex-col lg:flex-row p-4 sm:p-6 md:p-8 gap-4 sm:gap-6 md:gap-8 items-center">
             {/* Layout with Image */}
             {currentNews.image ? (
                 <>
                    {/* Image Column */}
                    <div className="w-full lg:w-5/12 h-[30vh] sm:h-[35vh] md:h-[40vh] lg:h-[80%] relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 animate-fade-in-left shrink-0">
                        <img 
                            src={currentNews.image} 
                            alt={currentNews.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text Column */}
                    <div className="w-full lg:w-7/12 flex flex-col justify-center gap-3 sm:gap-4 md:gap-6 animate-fade-in-right lg:pr-4">
                        <div className="inline-flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs sm:text-sm mb-1 sm:mb-2">
                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                             G1 Saúde - Notícias
                        </div>

                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg leading-tight break-words hyphens-auto">
                            {currentNews.title}
                        </h2>

                        {currentNews.description && (
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed border-l-4 border-blue-500 pl-3 sm:pl-4 md:pl-6 line-clamp-4 sm:line-clamp-6 lg:line-clamp-[8]">
                                {currentNews.description}
                            </p>
                        )}
                        
                         {/* ProgressBar / Indicator */}
                         <div className="mt-4 sm:mt-6 md:mt-8 flex gap-1.5 sm:gap-2 flex-wrap">
                            {allNews.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                                idx === newsIndex
                                    ? 'w-8 sm:w-12 bg-blue-500'
                                    : 'w-2 sm:w-3 bg-gray-600'
                                }`}
                            />
                            ))}
                        </div>
                    </div>
                 </>
             ) : (
                 /* Center Layout (No Image) */
                 <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center text-center animate-fade-in px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-blue-500/10 border-4 border-blue-500/30 animate-pulse mb-4 sm:mb-6 md:mb-8">
                        <span className="material-symbols-outlined text-blue-400 text-3xl sm:text-4xl md:text-5xl">
                        newsmode
                        </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white drop-shadow-2xl mb-4 sm:mb-6 md:mb-8 break-words hyphens-auto">
                        {currentNews.title}
                    </h2>

                    {currentNews.description && (
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 max-w-4xl leading-relaxed">
                             {currentNews.description}
                        </p>
                    )}
                     {/* ProgressBar / Indicator */}
                     <div className="mt-6 sm:mt-8 md:mt-12 flex gap-1.5 sm:gap-2 flex-wrap justify-center">
                        {allNews.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                            idx === newsIndex
                                ? 'w-8 sm:w-12 bg-blue-500'
                                : 'w-2 sm:w-3 bg-gray-600'
                            }`}
                        />
                        ))}
                    </div>
                 </div>
             )}
        </div>
      </main>
    </div>
  );
};

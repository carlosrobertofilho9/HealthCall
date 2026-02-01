import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);
  const [newsIndex, setNewsIndex] = useState(0);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [cycleCompleted, setCycleCompleted] = useState(false);
  const { speak } = useTextToSpeech();
  const lastSpokenIndexRef = useRef<number>(-1);

  useEffect(() => {
    fetchNews();
  }, []);

  // Rotate news every 20 seconds (increased time for reading summary)
  useEffect(() => {
    if (allNews.length === 0 || cycleCompleted) return;
    
    // Calculate reading time based on content length, min 15s, max 30s
    const textLength = (currentNews?.title?.length || 0) + (currentNews?.description?.length || 0);
    const displayTime = Math.min(Math.max(15000, textLength * 50), 30000);

    const timer = setTimeout(() => {
      setNewsIndex((prev) => {
        const nextIndex = prev + 1;
        
        // If we've shown all news, mark cycle as complete
        if (nextIndex >= allNews.length) {
          console.log('[NewsHeadline] Ciclo de notícias completo');
          setCycleCompleted(true);
          
          // Call completion callback after a delay
          setTimeout(() => {
            onCycleComplete?.();
          }, 5000); 
          
          return prev; // Stay on last news
        }
        
        return nextIndex;
      });
    }, displayTime);

    // Clean up timer when effect re-runs
    return () => clearTimeout(timer);
  }, [allNews.length, cycleCompleted, onCycleComplete, newsIndex, currentNews]);

  // Update current news and speak it when index changes
  useEffect(() => {
    if (allNews.length > 0 && newsIndex !== lastSpokenIndexRef.current) {
      const news = allNews[newsIndex];
      setCurrentNews(news);
      lastSpokenIndexRef.current = newsIndex;
      
      console.log(`[NewsHeadline] Exibindo notícia ${newsIndex + 1}/${allNews.length}`);
      
      // Speak the headline
      speak(news.title).catch(err => {
        console.error('[NewsHeadline] Erro ao falar manchete:', err);
      });
    }
  }, [newsIndex, allNews]);

  const fetchNews = async () => {
    try {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'rss_url')
        .single();
        
      const rssUrl = setting?.value || 'https://g1.globo.com/dynamo/saude/rss2.xml';

      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { url: rssUrl }
      });

      if (error) throw error;
      if (data?.items && data.items.length > 0) {
        setAllNews(data.items);
        setCurrentNews(data.items[0]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  if (!currentNews) return null;

  return (
    <div className="bg-gray-900 text-white h-full flex flex-col" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm shrink-0 z-20">
        <div className="flex flex-col">
          <span className="text-3xl font-bold font-mono tracking-wider">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
          <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
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

        <div className="relative z-10 w-full h-full flex p-8 gap-8 items-center">
             {/* Layout with Image */}
             {currentNews.image ? (
                 <>
                    {/* Image Column */}
                    <div className="w-5/12 h-[80%] relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 animate-fade-in-left">
                        <img 
                            src={currentNews.image} 
                            alt={currentNews.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text Column */}
                    <div className="w-7/12 flex flex-col justify-center gap-6 animate-fade-in-right pr-4">
                        <div className="inline-flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-sm mb-2">
                             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                             G1 Saúde - Notícias
                        </div>

                        <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                            {currentNews.title}
                        </h2>

                        {currentNews.description && (
                            <p className="text-xl text-gray-300 leading-relaxed border-l-4 border-blue-500 pl-6 line-clamp-[8]">
                                {currentNews.description}
                            </p>
                        )}
                        
                         {/* ProgressBar / Indicator */}
                         <div className="mt-8 flex gap-2">
                            {allNews.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === newsIndex
                                    ? 'w-12 bg-blue-500'
                                    : 'w-3 bg-gray-600'
                                }`}
                            />
                            ))}
                        </div>
                    </div>
                 </>
             ) : (
                 /* Center Layout (No Image) */
                 <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/10 border-4 border-blue-500/30 animate-pulse mb-8">
                        <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '48px' }}>
                        newsmode
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white drop-shadow-2xl mb-8">
                        {currentNews.title}
                    </h2>

                    {currentNews.description && (
                        <p className="text-2xl text-gray-300 max-w-4xl leading-relaxed">
                             {currentNews.description}
                        </p>
                    )}
                     {/* ProgressBar / Indicator */}
                     <div className="mt-12 flex gap-2">
                        {allNews.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${
                            idx === newsIndex
                                ? 'w-12 bg-blue-500'
                                : 'w-3 bg-gray-600'
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

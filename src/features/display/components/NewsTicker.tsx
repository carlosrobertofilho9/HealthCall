import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface NewsItem {
  title: string;
}

export const NewsTicker: React.FC = React.memo(() => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    // Refresh every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      // Get RSS URL from settings
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'rss_url')
        .single();
        
      const rssUrl = setting?.value || 'https://g1.globo.com/dynamo/saude/rss2.xml';

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { url: rssUrl }
      });

      if (error) throw error;
      if (data?.items) {
        setNews(data.items);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || news.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-blue-900/90 text-white z-20 border-t border-blue-500 overflow-hidden py-2 shadow-lg backdrop-blur-md">
      <div className="flex items-center">
         <div className="bg-blue-800 px-4 py-1 z-30 font-bold uppercase text-xs tracking-wider shadow-md shrink-0 mx-2 rounded">
            Notícias
         </div>
         <div className="overflow-hidden relative w-full">
             <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
                {news.map((item, index) => (
                    <span key={index} className="text-lg font-medium inline-flex items-center">
                        {item.title}
                        <span className="ml-16 inline-block w-2 h-2 rounded-full bg-blue-400/50" />
                    </span>
                ))}
                {/* Duplicate for infinite loop illusion */}
                {news.map((item, index) => (
                    <span key={`dup-${index}`} className="text-lg font-medium inline-flex items-center">
                        {item.title}
                        <span className="ml-16 inline-block w-2 h-2 rounded-full bg-blue-400/50" />
                    </span>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
});

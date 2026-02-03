import React, { useState, useEffect } from 'react';
import { Cloud, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
      isOnline 
        ? "bg-green-500/10 text-green-500 border border-green-500/20" 
        : "bg-red-500/10 text-red-500 border border-red-500/20"
    )}>
      {isOnline ? (
        <>
          <Cloud className="h-3 w-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
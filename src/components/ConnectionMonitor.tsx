import { useEffect, useState } from 'react';
import { Cloud, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Componente que monitora e exibe o status da conexão com a nuvem (Supabase).
 */
export function ConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const handleOnline = () => setStatus('connected');
    const handleOffline = () => setStatus('disconnected');

    if (navigator.onLine) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Cloud,
          text: 'Nuvem Ativa',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Conectando...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Offline',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center gap-2',
        'px-3 py-2 rounded-lg',
        'backdrop-blur-sm',
        'border border-border/50',
        'transition-all duration-300',
        config.bgColor
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          config.color,
          config.animate && 'animate-spin'
        )}
      />
      <span className={cn('text-sm font-medium', config.color)}>
        {config.text}
      </span>
    </div>
  );
}

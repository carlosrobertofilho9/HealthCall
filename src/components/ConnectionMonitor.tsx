import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Componente que monitora e exibe o status da conexão Realtime do Supabase
 */
export function ConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Monitorar mudanças de estado do canal Realtime
    const handleConnected = () => {
      setStatus('connected');
      setReconnectAttempts(0);
    };

    const handleDisconnected = () => {
      setStatus('disconnected');
    };

    const handleReconnecting = () => {
      setStatus('connecting');
      setReconnectAttempts((prev) => prev + 1);
    };

    // Subscribe para monitorar conexão
    // Nota: Supabase Realtime não expõe eventos de conexão diretamente,
    // então vamos fazer polling simples
    const checkConnection = () => {
      const channel = supabase.channel('connection-monitor');
      
      channel
        .on('system', {}, () => {
          setStatus('connected');
          setReconnectAttempts(0);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('connected');
            setReconnectAttempts(0);
          } else if (status === 'CHANNEL_ERROR') {
            setStatus('disconnected');
          } else if (status === 'TIMED_OUT') {
            setStatus('connecting');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = checkConnection();
    return cleanup;
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Conectado',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: reconnectAttempts > 0
            ? `Reconectando... (${reconnectAttempts})`
            : 'Conectando...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Desconectado',
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

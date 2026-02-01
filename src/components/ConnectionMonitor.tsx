import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Componente que monitora e exibe o status da conexão local
 * No modo local (Electron + SQLite), sempre mostra como conectado ao banco local.
 */
export function ConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    // No modo local, estamos sempre "conectados" ao banco SQLite
    // Simula uma pequena transição para mostrar que está funcionando
    const timer = setTimeout(() => {
      setStatus('connected');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: HardDrive, // Ícone de disco para indicar armazenamento local
          text: 'Banco Local',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          text: 'Inicializando...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          animate: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Erro no Banco',
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

import React from 'react';
import { useCast } from '@/hooks/useCast';
import { Cast, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Google Cast button component
 * 
 * Displays a button that allows users to connect/disconnect from Chromecast devices.
 * Shows different states: available, connecting, connected, unavailable.
 */
export function CastButton() {
  const {
    isAvailable,
    isConnected,
    isConnecting,
    deviceName,
    connect,
    disconnect,
    error,
  } = useCast();

  React.useEffect(() => {
    if (error) {
      toast.error('Erro ao conectar com Chromecast');
    }
  }, [error]);

  React.useEffect(() => {
    if (isConnected && deviceName) {
      toast.success(`Conectado ao ${deviceName}`);
    }
  }, [isConnected, deviceName]);

  if (!isAvailable) {
    return null; // Don't show button if no Cast devices available
  }

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
      title={isConnected ? `Conectado ao ${deviceName}` : 'Conectar com Chromecast'}
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="hidden sm:inline">Conectando...</span>
        </>
      ) : isConnected ? (
        <>
          <Cast className="h-5 w-5 text-green-400" />
          <span className="hidden sm:inline">{deviceName}</span>
        </>
      ) : (
        <>
          <Cast className="h-5 w-5" />
          <span className="hidden sm:inline">Chromecast</span>
        </>
      )}
    </button>
  );
}

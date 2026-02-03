import React, { useState, useEffect } from 'react';
import { Cloud, Wifi, WifiOff } from 'lucide-react';

export function SyncSettings() {
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
    <div className="space-y-6">
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Cloud className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-medium text-white">Sincronização em Nuvem</h3>
                  <p className="text-sm text-gray-400">
                    Conectado ao Supabase
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-6 w-6 text-red-500" />
                <div>
                  <h3 className="font-medium text-white">Sem Conexão</h3>
                  <p className="text-sm text-gray-400">
                    Verifique sua internet
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-400">
          O sistema utiliza o Supabase para armazenar e sincronizar dados em tempo real entre todos os dispositivos.
        </p>
      </div>
    </div>
  );
}

export default SyncSettings;

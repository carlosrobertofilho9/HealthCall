/**
 * NETWORK SYNC CONTEXT
 * 
 * Contexto simplificado para gerenciar estado de conexão (Online/Offline)
 * e sincronização com Supabase.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkSyncContextType {
  isConnected: boolean; // Online status
  isSupabaseConnected: boolean; // Supabase connection status
  lastSyncTime: number | null;
}

const NetworkSyncContext = createContext<NetworkSyncContextType | undefined>(undefined);

export function useNetworkSyncContext(): NetworkSyncContextType {
  const context = useContext(NetworkSyncContext);
  if (!context) {
    throw new Error('useNetworkSyncContext deve ser usado dentro de NetworkSyncProvider');
  }
  return context;
}

interface NetworkSyncProviderProps {
  children: React.ReactNode;
}

export function NetworkSyncProvider({ children }: NetworkSyncProviderProps) {
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true); // Assume true initially
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(Date.now());

  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value: NetworkSyncContextType = {
    isConnected,
    isSupabaseConnected,
    lastSyncTime
  };

  return (
    <NetworkSyncContext.Provider value={value}>
      {children}
    </NetworkSyncContext.Provider>
  );
}

export default NetworkSyncProvider;

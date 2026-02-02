/**
 * NetworkSyncContext
 * 
 * Contexto React que provê a funcionalidade de sincronização de rede
 * para toda a aplicação. Gerencia a conexão com o servidor e mantém
 * os dados sincronizados em tempo real.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkSync, type NetworkSyncState } from '@/hooks/useNetworkSync';
import { useElectron } from '@/hooks/useElectron';

interface NetworkSyncContextType extends NetworkSyncState {
  // Flag para indicar modo de operação
  mode: 'server' | 'client' | 'standalone';
}

const NetworkSyncContext = createContext<NetworkSyncContextType | undefined>(undefined);

/**
 * Hook para acessar o contexto de sincronização de rede
 */
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

/**
 * Provider que gerencia a sincronização de rede
 * 
 * Modos de operação:
 * - server: Quando rodando no Electron, atua como servidor (dados locais)
 * - client: Quando conectado a um servidor remoto (sincroniza via rede)
 * - standalone: Modo offline/sem conexão
 */
export function NetworkSyncProvider({ children }: NetworkSyncProviderProps) {
  const { isElectron } = useElectron();
  const networkSync = useNetworkSync();
  const [mode, setMode] = useState<'server' | 'client' | 'standalone'>('standalone');
  const [serverAddresses, setServerAddresses] = useState<string[]>([]);

  // Determina o modo de operação
  useEffect(() => {
    if (isElectron) {
      // No Electron, estamos rodando como servidor
      setMode('server');
      
      // Obtém endereços do servidor local via IPC
      const getServerInfo = async () => {
        try {
          // @ts-expect-error - electron API
          const result = await window.electron?.invoke('sync:server-info');
          if (result?.success && result.data?.addresses) {
            setServerAddresses(result.data.addresses.map((a: { url: string }) => a.url));
          }
        } catch (error) {
          console.error('[NetworkSync] Erro ao obter info do servidor:', error);
        }
      };
      
      getServerInfo();
    } else if (networkSync.isConnected) {
      // No navegador conectado, somos cliente
      setMode('client');
    } else {
      // Sem conexão
      setMode('standalone');
    }
  }, [isElectron, networkSync.isConnected]);

  // Auto-conecta ao servidor local quando no Electron
  useEffect(() => {
    if (isElectron && !networkSync.isConnected && serverAddresses.length > 0) {
      // Conecta ao servidor local
      const localUrl = serverAddresses.find(url => url.includes('localhost') || url.includes('127.0.0.1'));
      if (localUrl) {
        console.log('[NetworkSync] Auto-conectando ao servidor local:', localUrl);
        networkSync.connect(localUrl);
      }
    }
  }, [isElectron, networkSync, serverAddresses]);

  const value: NetworkSyncContextType = {
    ...networkSync,
    mode,
  };

  return (
    <NetworkSyncContext.Provider value={value}>
      {children}
    </NetworkSyncContext.Provider>
  );
}

export default NetworkSyncProvider;

/**
 * NETWORK SYNC CONTEXT
 * 
 * Contexto React que provê a funcionalidade de sincronização de rede
 * para toda a aplicação. Gerencia a conexão com o servidor e mantém
 * os dados sincronizados em tempo real.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkSync, type NetworkSyncState } from '@/hooks/useNetworkSync';
import { useElectron } from '@/hooks/useElectron';

export interface LocalServerInfo {
  running: boolean;
  port: number;
  clients: number;
  addresses: Array<{
    interface: string;
    address: string;
    url: string;
  }>;
  clientsList?: Array<{
    ip: string;
    id: string;
    joinedAt: number;
    deviceName?: string;
  }>;
}

interface NetworkSyncContextType extends NetworkSyncState {
  // Flag para indicar modo de operação
  mode: 'server' | 'client' | 'standalone';
  // Informações detalhadas do servidor (quando em modo server)
  localServerInfo: LocalServerInfo | null;
  // Controle do modo "Somente Cliente" (Legado, manter por compatibilidade/simplicidade se quiser)
  forceClientMode: boolean;
  setForceClientMode: (enabled: boolean) => Promise<void>;
  
  // Novo Seletor de Modo
  syncMode: 'auto' | 'server' | 'client' | 'neutral';
  setSyncMode: (mode: 'auto' | 'server' | 'client' | 'neutral') => Promise<void>;
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
  const [localServerInfo, setLocalServerInfo] = useState<LocalServerInfo | null>(null);
  const [forceClientMode, setForceClientModeState] = useState(false);
  const [syncMode, setSyncModeState] = useState<'auto' | 'server' | 'client' | 'neutral'>('neutral');

  // Carrega configuração inicial
  useEffect(() => {
    if (isElectron) {
      // Carrega Legacy
      window.electron?.sync?.getForceClientMode?.().then(result => {
        setForceClientModeState(!!result?.enabled);
      }).catch(console.error);

      // Carrega Novo Modo
      window.electron?.sync?.getSyncMode?.().then(result => {
        if (result?.mode) setSyncModeState(result.mode);
      }).catch(console.error);
    }
  }, [isElectron]);

  const setForceClientMode = async (enabled: boolean) => {
    if (isElectron) {
      await window.electron?.sync?.setForceClientMode?.(enabled);
      setForceClientModeState(enabled);
      // Atualiza também o syncMode para refletir
      setSyncModeState(enabled ? 'client' : 'auto');
    }
  };

  const setSyncMode = async (mode: 'auto' | 'server' | 'client' | 'neutral') => {
    if (isElectron) {
      await window.electron?.sync?.setSyncMode?.(mode);
      setSyncModeState(mode);
      // Atualiza legacy flag
      setForceClientModeState(mode === 'client');
      
      // Update local mode state immediately for UI responsiveness
      if (mode === 'neutral') {
          setMode('standalone');
          setLocalServerInfo(null);
      }
    }
  };

  // Determina o modo de operação e inicia polling de status se for servidor
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateServerInfo = async () => {
      if (!isElectron) return;

      try {
        const result = await window.electron?.sync?.getServerInfo();
        if (result) {
          setLocalServerInfo(result);
        }
      } catch (error) {
        console.error('[NetworkSync] Erro ao obter info do servidor:', error);
      }
    };

    if (isElectron) {
      // Se não for 'client' forçado (seja por legacy flag ou novo mode)
      const isClientForced = forceClientMode || syncMode === 'client';
      
      if (!isClientForced) {
          // O modo 'server' é definido se o syncMode no main process for 'server'
          // Mas como não temos acesso direto ao syncMode aqui (apenas via getServerInfo que retorna null se não for server),
          // confiamos na resposta do getServerInfo
          updateServerInfo();
          intervalId = setInterval(updateServerInfo, 5000);
          
          // Se receber info, assume server. Se não, verifica se é cliente
          window.electron?.sync?.getServerInfo().then(info => {
             if (info?.running) setMode('server');
             else if (networkSync.isConnected) setMode('client');
          });
      } else {
        setMode('client');
      }
    } else if (networkSync.isConnected) {
      setMode('client');
    } else {
      setMode('standalone');
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isElectron, networkSync.isConnected, forceClientMode, syncMode]);
  
  // Atualiza mode baseado no serverInfo se disponível
  useEffect(() => {
      if (localServerInfo?.running) {
          setMode('server');
      }
  }, [localServerInfo]);

  // Auto-conecta ao servidor local quando no Electron (loopback) para receber updates via WS
  // Isso permite que a própria janela do servidor receba eventos como broadcasts
  useEffect(() => {
    if (isElectron && !networkSync.isConnected && localServerInfo?.addresses) {
      const localUrl = localServerInfo.addresses.find(a => 
        a.address === '127.0.0.1' || a.address === 'localhost'
      )?.url;

      if (localUrl) {
        console.log('[NetworkSync] Auto-conectando ao servidor local:', localUrl);
        networkSync.connect(localUrl);
      }
    }
  }, [isElectron, networkSync.isConnected, localServerInfo]);

  const value: NetworkSyncContextType = {
    ...networkSync,
    mode,
    localServerInfo,
    forceClientMode,
    setForceClientMode,
    syncMode,
    setSyncMode
  };

  return (
    <NetworkSyncContext.Provider value={value}>
      {children}
    </NetworkSyncContext.Provider>
  );
}

export default NetworkSyncProvider;

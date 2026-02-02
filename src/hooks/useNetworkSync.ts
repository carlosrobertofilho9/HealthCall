/**
 * Hook useNetworkSync
 * 
 * Gerencia a conexão com o servidor de sincronização HealthCall.
 * Fornece estado reativo para conexão, dados e atualizações em tempo real.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { syncClient, discoverServer, type DataUpdateEvent, type ServerStatus } from '@/services/networkSyncClient';
import type { Patient, Warning, CallRecord } from '@/types';
import { toast } from 'sonner';

export interface NetworkSyncState {
  // Estado da conexão
  isConnected: boolean;
  isConnecting: boolean;
  serverUrl: string | null;
  serverInfo: ServerStatus | null;
  connectedClients: number;
  
  // Dados sincronizados
  patients: Patient[];
  warnings: Warning[];
  callHistory: CallRecord[];
  lastCall: { patient: Patient; location: string } | null;
  
  // Funções de conexão
  connect: (serverUrl: string) => Promise<boolean>;
  disconnect: () => void;
  discoverAndConnect: () => Promise<boolean>;
  
  // Funções de dados - Pacientes
  addPatient: (name: string, destination: string) => Promise<Patient | null>;
  addPatientByNumber: (destination: string) => Promise<Patient | null>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<Patient | null>;
  callPatient: (id: string, destination: string) => Promise<Patient | null>;
  removePatient: (id: string) => Promise<boolean>;
  clearQueue: () => Promise<boolean>;
  
  // Funções de dados - Avisos
  getWarnings: () => Promise<Warning[]>;
  getActiveWarnings: () => Promise<Warning[]>;
  
  // Funções de dados - Chamadas
  getCallHistory: () => Promise<CallRecord[]>;
  getLastCall: () => Promise<{ patient: Patient; location: string } | null>;
  
  // Refresh manual
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'healthcall_server_url';

export function useNetworkSync(): NetworkSyncState {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(() => {
    // Tenta recuperar URL salva
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [serverInfo, setServerInfo] = useState<ServerStatus | null>(null);
  const [connectedClients, setConnectedClients] = useState(0);
  
  // Dados sincronizados
  const [patients, setPatients] = useState<Patient[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [lastCall, setLastCall] = useState<{ patient: Patient; location: string } | null>(null);
  
  const isInitialized = useRef(false);

  /**
   * Carrega todos os dados do servidor
   */
  const loadAllData = useCallback(async () => {
    if (!syncClient.isConnected()) return;
    
    try {
      const [patientsData, warningsData, historyData, lastCallData] = await Promise.all([
        syncClient.getPatients(),
        syncClient.getActiveWarnings(),
        syncClient.getCallHistory(),
        syncClient.getLastCall(),
      ]);
      
      setPatients(patientsData);
      setWarnings(warningsData);
      setCallHistory(historyData);
      setLastCall(lastCallData);
    } catch (error) {
      console.error('[useNetworkSync] Erro ao carregar dados:', error);
    }
  }, []);

  /**
   * Conecta ao servidor
   */
  const connect = useCallback(async (url: string): Promise<boolean> => {
    if (isConnecting) return false;
    
    setIsConnecting(true);
    
    try {
      const success = await syncClient.connect({
        serverUrl: url,
        autoReconnect: true,
        reconnectInterval: 5000,
        onConnect: () => {
          setIsConnected(true);
          toast.success('Conectado ao servidor', {
            description: url,
          });
        },
        onDisconnect: () => {
          setIsConnected(false);
          toast.warning('Desconectado do servidor', {
            description: 'Tentando reconectar...',
          });
        },
        onDataUpdate: (event: DataUpdateEvent) => {
          console.log('[useNetworkSync] Data update:', event);
          // Atualiza dados locais baseado no evento
          handleDataUpdate(event);
        },
        onError: (error) => {
          console.error('[useNetworkSync] Erro:', error);
          toast.error('Erro na conexão', {
            description: error.message,
          });
        },
      });
      
      if (success) {
        setServerUrl(url);
        // Salva URL para reconexão automática
        try {
          localStorage.setItem(STORAGE_KEY, url);
        } catch {}
        
        // Obtém info do servidor
        const info = await syncClient.getServerStatus();
        setServerInfo(info);
        setConnectedClients(info.clients);
        
        // Carrega todos os dados
        await loadAllData();
      }
      
      return success;
    } catch (error) {
      console.error('[useNetworkSync] Erro ao conectar:', error);
      toast.error('Falha ao conectar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, loadAllData]);

  /**
   * Desconecta do servidor
   */
  const disconnect = useCallback(() => {
    syncClient.disconnect();
    setIsConnected(false);
    setServerUrl(null);
    setServerInfo(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    toast.info('Desconectado do servidor');
  }, []);

  /**
   * Descobre e conecta automaticamente ao servidor
   */
  const discoverAndConnect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    toast.info('Procurando servidor na rede...', {
      id: 'discovering',
    });
    
    try {
      const foundUrl = await discoverServer(3000);
      
      if (foundUrl) {
        toast.dismiss('discovering');
        return await connect(foundUrl);
      } else {
        toast.error('Servidor não encontrado', {
          id: 'discovering',
          description: 'Verifique se o servidor está rodando e na mesma rede',
        });
        return false;
      }
    } catch (error) {
      toast.error('Erro ao procurar servidor', {
        id: 'discovering',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  /**
   * Trata atualizações de dados recebidas via WebSocket
   */
  const handleDataUpdate = useCallback((event: DataUpdateEvent) => {
    switch (event.table) {
      case 'patients':
        // Recarrega lista de pacientes
        syncClient.getPatients().then(setPatients).catch(console.error);
        break;
      
      case 'calls':
        // Recarrega histórico e última chamada
        syncClient.getCallHistory().then(setCallHistory).catch(console.error);
        syncClient.getLastCall().then(setLastCall).catch(console.error);
        break;
      
      case 'warnings':
        // Recarrega avisos
        syncClient.getActiveWarnings().then(setWarnings).catch(console.error);
        break;
    }
  }, []);

  /**
   * Configura listeners de eventos
   */
  useEffect(() => {
    const handleClientsChanged = (data: unknown) => {
      const event = data as { clients: number };
      setConnectedClients(event.clients);
    };

    const handleFullSync = (data: unknown) => {
      const event = data as { data: { patients: Patient[]; warnings: Warning[] } };
      if (event.data) {
        setPatients(event.data.patients || []);
        setWarnings(event.data.warnings || []);
      }
    };

    syncClient.on('clients_changed', handleClientsChanged);
    syncClient.on('full_sync', handleFullSync);
    syncClient.on('data_update', handleDataUpdate);

    return () => {
      syncClient.off('clients_changed', handleClientsChanged);
      syncClient.off('full_sync', handleFullSync);
      syncClient.off('data_update', handleDataUpdate);
    };
  }, [handleDataUpdate]);

  /**
   * Reconexão automática ao inicializar
   */
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Se temos uma URL salva, tenta reconectar
    const savedUrl = localStorage.getItem(STORAGE_KEY);
    if (savedUrl) {
      console.log('[useNetworkSync] Tentando reconectar a:', savedUrl);
      connect(savedUrl).catch(console.error);
    }
  }, [connect]);

  // ============================================
  // Funções de manipulação de dados
  // ============================================

  const addPatient = useCallback(async (name: string, destination: string): Promise<Patient | null> => {
    if (!isConnected) {
      toast.error('Não conectado ao servidor');
      return null;
    }
    
    try {
      const patient = await syncClient.addPatient(name, destination);
      // Dados serão atualizados via WebSocket
      return patient;
    } catch (error) {
      toast.error('Erro ao adicionar paciente', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return null;
    }
  }, [isConnected]);

  const addPatientByNumber = useCallback(async (destination: string): Promise<Patient | null> => {
    if (!isConnected) {
      toast.error('Não conectado ao servidor');
      return null;
    }
    
    try {
      const patient = await syncClient.addPatientByNumber(destination);
      return patient;
    } catch (error) {
      toast.error('Erro ao adicionar ficha', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return null;
    }
  }, [isConnected]);

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>): Promise<Patient | null> => {
    if (!isConnected) {
      toast.error('Não conectado ao servidor');
      return null;
    }
    
    try {
      const patient = await syncClient.updatePatient(id, updates);
      return patient;
    } catch (error) {
      toast.error('Erro ao atualizar paciente', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return null;
    }
  }, [isConnected]);

  const callPatient = useCallback(async (id: string, destination: string): Promise<Patient | null> => {
    if (!isConnected) {
      toast.error('Não conectado ao servidor');
      return null;
    }
    
    try {
      const patient = await syncClient.callPatient(id, destination);
      return patient;
    } catch (error) {
      toast.error('Erro ao chamar paciente', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return null;
    }
  }, [isConnected]);

  const removePatient = useCallback(async (id: string): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Não conectado ao servidor');
      return false;
    }
    
    try {
      await syncClient.removePatient(id);
      return true;
    } catch (error) {
      toast.error('Erro ao remover paciente', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return false;
    }
  }, [isConnected]);

  const clearQueue = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Não conectado ao servidor');
      return false;
    }
    
    try {
      await syncClient.clearQueue();
      toast.success('Fila limpa com sucesso');
      return true;
    } catch (error) {
      toast.error('Erro ao limpar fila', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return false;
    }
  }, [isConnected]);

  const getWarnings = useCallback(async (): Promise<Warning[]> => {
    if (!isConnected) return [];
    try {
      return await syncClient.getWarnings();
    } catch {
      return [];
    }
  }, [isConnected]);

  const getActiveWarnings = useCallback(async (): Promise<Warning[]> => {
    if (!isConnected) return [];
    try {
      return await syncClient.getActiveWarnings();
    } catch {
      return [];
    }
  }, [isConnected]);

  const getCallHistory = useCallback(async (): Promise<CallRecord[]> => {
    if (!isConnected) return [];
    try {
      return await syncClient.getCallHistory();
    } catch {
      return [];
    }
  }, [isConnected]);

  const getLastCall = useCallback(async (): Promise<{ patient: Patient; location: string } | null> => {
    if (!isConnected) return null;
    try {
      return await syncClient.getLastCall();
    } catch {
      return null;
    }
  }, [isConnected]);

  const refresh = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  return {
    // Estado
    isConnected,
    isConnecting,
    serverUrl,
    serverInfo,
    connectedClients,
    
    // Dados
    patients,
    warnings,
    callHistory,
    lastCall,
    
    // Conexão
    connect,
    disconnect,
    discoverAndConnect,
    
    // Operações
    addPatient,
    addPatientByNumber,
    updatePatient,
    callPatient,
    removePatient,
    clearQueue,
    getWarnings,
    getActiveWarnings,
    getCallHistory,
    getLastCall,
    refresh,
  };
}

export default useNetworkSync;

/**
 * Componente de Status e Configuração de Sincronização
 * 
 * Mostra o modo atual (servidor/cliente) e permite:
 * - Ver IPs disponíveis para conexão (modo servidor)
 * - Conectar a outro servidor (modo cliente)
 * - Descobrir servidores na rede
 * - Forçar modo servidor
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Server, Monitor, RefreshCw, Settings, Copy, Check, Search, Loader2 } from 'lucide-react';

interface ServerInfo {
  url?: string;
  wsUrl?: string;
  port?: number;
  addresses?: Array<{ interface: string; address: string }>;
  clients?: number;
}

interface SyncMode {
  mode: 'server' | 'client' | 'standalone' | null;
  serverInfo: ServerInfo | null;
}

interface DiscoveredServer {
  found: boolean;
  ip: string;
  port: number;
  url: string;
  wsUrl: string;
  version?: string;
  clients?: number;
}

export function SyncSettings() {
  const [syncMode, setSyncMode] = useState<SyncMode>({ mode: null, serverInfo: null });
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredServers, setDiscoveredServers] = useState<DiscoveredServer[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se estamos no Electron
  const isElectron = typeof window !== 'undefined' && window.electron;

  // Carregar modo atual
  const loadSyncMode = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const mode = await window.electron.sync.getMode();
      setSyncMode(mode);
      
      // Se for servidor, carregar informações adicionais
      if (mode.mode === 'server') {
        const serverInfo = await window.electron.sync.getServerInfo();
        if (serverInfo) {
          setSyncMode(prev => ({ ...prev, serverInfo }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar modo de sincronização:', err);
    }
  }, [isElectron]);

  useEffect(() => {
    loadSyncMode();
    
    // Ouvir mudanças de modo
    if (isElectron) {
      const handleModeChange = (data: SyncMode) => {
        setSyncMode(data);
      };
      
      window.electron.on('sync-mode-changed', handleModeChange);
      return () => {
        window.electron.off('sync-mode-changed', handleModeChange);
      };
    }
  }, [loadSyncMode, isElectron]);

  // Descobrir servidores na rede
  const handleDiscover = async () => {
    if (!isElectron) return;
    
    setIsDiscovering(true);
    setError(null);
    setDiscoveredServers([]);
    
    try {
      const servers = await window.electron.sync.discoverServers();
      setDiscoveredServers(servers);
      
      if (servers.length === 0) {
        setError('Nenhum servidor encontrado na rede');
      }
    } catch (err) {
      setError('Erro ao descobrir servidores');
      console.error(err);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Conectar a um servidor
  const handleConnect = async (serverUrl: string) => {
    if (!isElectron) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      const result = await window.electron.sync.connectToServer(serverUrl);
      
      if (result.success) {
        setSyncMode({ mode: 'client', serverInfo: result.server });
        setDiscoveredServers([]);
        setManualUrl('');
      } else {
        setError(result.error || 'Erro ao conectar');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  // Forçar modo servidor
  const handleForceServer = async () => {
    if (!isElectron) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      const result = await window.electron.sync.forceServerMode();
      
      if (result.success) {
        setSyncMode({ mode: 'server', serverInfo: result.serverInfo });
      } else {
        setError(result.error || 'Erro ao iniciar servidor');
      }
    } catch (err) {
      setError('Erro ao iniciar modo servidor');
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  // Copiar endereço
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  if (!isElectron) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-500 text-sm">
          Sincronização disponível apenas na versão desktop
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {syncMode.mode === 'server' ? (
              <>
                <Server className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-medium text-white">Modo Servidor</h3>
                  <p className="text-sm text-gray-400">
                    Este computador é o servidor central
                  </p>
                </div>
              </>
            ) : syncMode.mode === 'client' ? (
              <>
                <Monitor className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="font-medium text-white">Modo Cliente</h3>
                  <p className="text-sm text-gray-400">
                    Conectado a {syncMode.serverInfo?.url || 'servidor'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-6 w-6 text-gray-500" />
                <div>
                  <h3 className="font-medium text-white">Modo Standalone</h3>
                  <p className="text-sm text-gray-400">
                    Sem sincronização de rede
                  </p>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={loadSyncMode}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Atualizar status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Endereços do Servidor (quando em modo servidor) */}
      {syncMode.mode === 'server' && syncMode.serverInfo?.addresses && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Endereços para conexão
          </h4>
          <p className="text-sm text-gray-400 mb-3">
            Outros computadores podem se conectar usando um destes endereços:
          </p>
          <div className="space-y-2">
            {syncMode.serverInfo.addresses.map((addr, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
              >
                <div>
                  <span className="text-xs text-gray-500">{addr.interface}:</span>
                  <code className="ml-2 text-green-400">
                    http://{addr.address}:{syncMode.serverInfo?.port || 3457}
                  </code>
                </div>
                <button
                  onClick={() => handleCopyAddress(`http://${addr.address}:${syncMode.serverInfo?.port || 3457}`)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  title="Copiar endereço"
                >
                  {copiedAddress === `http://${addr.address}:${syncMode.serverInfo?.port || 3457}` ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
          {syncMode.serverInfo.clients !== undefined && (
            <p className="mt-3 text-sm text-gray-400">
              Clientes conectados: <span className="text-white">{syncMode.serverInfo.clients}</span>
            </p>
          )}
        </div>
      )}

      {/* Descobrir Servidores */}
      {syncMode.mode !== 'server' && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h4 className="font-medium text-white mb-3">Conectar a outro servidor</h4>
          
          {/* Busca automática */}
          <button
            onClick={handleDiscover}
            disabled={isDiscovering}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors mb-4"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando na rede...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Descobrir servidores
              </>
            )}
          </button>

          {/* Servidores encontrados */}
          {discoveredServers.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-400">Servidores encontrados:</p>
              {discoveredServers.map((server, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded"
                >
                  <div>
                    <code className="text-blue-400">{server.url}</code>
                    {server.clients !== undefined && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({server.clients} clientes)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleConnect(server.url)}
                    disabled={connecting}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Conectar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Conexão manual */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="http://192.168.1.x:3457"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500"
            />
            <button
              onClick={() => handleConnect(manualUrl)}
              disabled={connecting || !manualUrl}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conectar'}
            </button>
          </div>
        </div>
      )}

      {/* Forçar modo servidor */}
      {syncMode.mode === 'client' && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h4 className="font-medium text-white mb-2">Tornar este computador o servidor</h4>
          <p className="text-sm text-gray-400 mb-3">
            Desconecta do servidor atual e inicia como servidor central.
          </p>
          <button
            onClick={handleForceServer}
            disabled={connecting}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Iniciar como servidor'}
          </button>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Informações */}
      <div className="p-4 bg-gray-800/30 rounded-lg text-sm text-gray-400">
        <h5 className="font-medium text-gray-300 mb-2">Como funciona:</h5>
        <ul className="space-y-1 list-disc list-inside">
          <li>O primeiro computador a abrir o app se torna o <strong>servidor</strong></li>
          <li>Outros computadores na mesma rede se conectam automaticamente como <strong>clientes</strong></li>
          <li>Todos os dados são sincronizados em tempo real</li>
          <li>Para redes diferentes, use VPN ou configure port forwarding</li>
        </ul>
      </div>
    </div>
  );
}

export default SyncSettings;

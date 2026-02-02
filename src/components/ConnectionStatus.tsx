/**
 * ConnectionStatus Component
 * 
 * Exibe o status da conexão com o servidor de sincronização
 * e permite configurar a conexão manualmente.
 */

import React, { useState } from 'react';
import { useNetworkSyncContext } from '@/contexts/NetworkSyncContext';
import { useElectron } from '@/hooks/useElectron';
import {
  Wifi,
  WifiOff,
  Server,
  Monitor,
  Users,
  RefreshCw,
  Settings,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function ConnectionStatus({ showDetails = false, className = '' }: ConnectionStatusProps) {
  const { isElectron } = useElectron();
  const {
    isConnected,
    isConnecting,
    serverUrl,
    serverInfo,
    connectedClients,
    mode,
    connect,
    disconnect,
    discoverAndConnect,
  } = useNetworkSyncContext();

  const [showConfig, setShowConfig] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const handleConnect = async () => {
    if (manualUrl.trim()) {
      const success = await connect(manualUrl.trim());
      if (success) {
        setShowConfig(false);
        setManualUrl('');
      }
    }
  };

  const handleDiscover = async () => {
    const success = await discoverAndConnect();
    if (success) {
      setShowConfig(false);
    }
  };

  // No modo servidor (Electron), considera como "conectado" pois os dados são locais
  const isEffectivelyConnected = mode === 'server' || isConnected;

  // Ícone e cor baseados no estado
  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
    }
    if (isEffectivelyConnected) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    }
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'server':
        return <Server className="w-4 h-4 text-blue-500" />;
      case 'client':
        return <Monitor className="w-4 h-4 text-green-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'server':
        return 'Servidor';
      case 'client':
        return 'Cliente';
      default:
        return 'Offline';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Status Compacto */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        title={isEffectivelyConnected ? (mode === 'server' ? 'Servidor ativo' : `Conectado: ${serverUrl}`) : 'Não conectado'}
      >
        {getStatusIcon()}
        
        {showDetails && (
          <>
            <span className="text-sm text-gray-300">
              {isConnecting ? 'Conectando...' : isEffectivelyConnected ? (mode === 'server' ? 'Servidor' : 'Conectado') : 'Desconectado'}
            </span>
            
            {isEffectivelyConnected && mode !== 'server' && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3 h-3" />
                <span>{connectedClients}</span>
              </div>
            )}
          </>
        )}
        
        <Settings className="w-4 h-4 text-gray-400" />
      </button>

      {/* Painel de Configuração */}
      {showConfig && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-4 space-y-4">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Sincronização de Rede</h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Atual */}
            <div className="p-3 bg-gray-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Modo</span>
                <div className="flex items-center gap-2">
                  {getModeIcon()}
                  <span className="text-sm text-white">{getModeLabel()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  {isEffectivelyConnected ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-white">
                    {isEffectivelyConnected ? (mode === 'server' ? 'Ativo' : 'Conectado') : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              {isEffectivelyConnected && mode !== 'server' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Clientes</span>
                    <span className="text-sm text-white">{connectedClients}</span>
                  </div>
                  
                  {serverUrl && (
                    <div className="text-xs text-gray-400 break-all">
                      {serverUrl}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Endereços do servidor (quando é servidor) */}
            {isElectron && serverInfo?.addresses && (
              <div className="space-y-2">
                <span className="text-sm text-gray-400">Endereços do servidor:</span>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {serverInfo.addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-green-400"
                    >
                      {addr.url}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Use um destes endereços para conectar outros computadores.
                </p>
              </div>
            )}

            {/* Ações */}
            {!isElectron && (
              <div className="space-y-3">
                {/* Descoberta automática */}
                <button
                  onClick={handleDiscover}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Descobrir servidor automaticamente</span>
                </button>

                {/* Conexão manual */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="http://192.168.1.100:3457"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={!manualUrl.trim() || isConnecting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Conectar
                  </button>
                </div>

                {/* Desconectar */}
                {isConnected && (
                  <button
                    onClick={disconnect}
                    className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            )}

            {/* Info para servidor */}
            {isElectron && (
              <p className="text-xs text-gray-500 text-center">
                Este computador está atuando como servidor. Outros dispositivos podem
                conectar-se usando os endereços acima.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;

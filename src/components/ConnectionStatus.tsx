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
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
          ${isConnecting 
            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' 
            : isEffectivelyConnected 
              ? mode === 'server'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }
          hover:bg-opacity-20
        `}
        title={isEffectivelyConnected ? (mode === 'server' ? 'Servidor ativo' : `Conectado: ${serverUrl}`) : 'Não conectado'}
      >
        <div className="relative flex h-2 w-2">
          {isEffectivelyConnected && !isConnecting && (
             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === 'server' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnecting ? 'bg-yellow-500 animate-pulse' : 
            isEffectivelyConnected ? (mode === 'server' ? 'bg-blue-500' : 'bg-green-500') : 
            'bg-red-500'
          }`}></span>
        </div>
        
        <span className="text-xs font-medium">
          {isConnecting ? 'Conectando...' : 
           isEffectivelyConnected ? (mode === 'server' ? 'Servidor' : 'Sincronizado') : 
           'Offline'}
        </span>
      </button>

      {/* Painel de Configuração */}
      {showConfig && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1c1e] text-white rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Status da Rede</h3>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status Card */}
            <div className={`p-4 rounded-lg border ${
              isEffectivelyConnected 
                ? 'bg-emerald-500/10 border-emerald-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Estado Atual</span>
                {isEffectivelyConnected ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    <Check className="w-3 h-3" />
                    {mode === 'server' ? 'Servidor Ativo' : 'Conectado'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                    <WifiOff className="w-3 h-3" />
                    Desconectado
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                       {mode === 'server' ? <Server className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                       Modo de Operação
                    </span>
                    <span className="text-white font-medium">{mode === 'server' ? 'Servidor / Principal' : 'Cliente / Display'}</span>
                 </div>
                 
                 {isEffectivelyConnected && mode !== 'server' && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Dispositivos
                        </span>
                        <span className="text-white font-medium">{connectedClients} online</span>
                    </div>
                 )}
              </div>
            </div>

            {/* Server Info (IPs) - Only shown for Server Mode */}
            {isElectron && mode === 'server' && serverInfo?.addresses && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Endereços para Conexão
                </span>
                <div className="bg-black/30 rounded-lg p-2 space-y-1 border border-white/5">
                  {serverInfo.addresses.map((addr, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs group">
                      <code className="text-emerald-400 font-mono">{addr.url}</code>
                      <span className="text-gray-500 text-[10px]">{addr.interface || 'Rede Local'}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Use estes endereços em outros computadores para conectar como Cliente.
                </p>
              </div>
            )}

            {/* Connection Actions - Only for Client/Auto Mode */}
            {mode !== 'server' && (
               <div className="space-y-3 pt-2 border-t border-white/10">
                  <button
                    onClick={handleDiscover}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600/50 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-blue-500/20"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Procurar Servidor
                  </button>

                  {!isElectron && (
                     <div className="flex gap-2">
                       <input
                         type="text"
                         value={manualUrl}
                         onChange={(e) => setManualUrl(e.target.value)}
                         placeholder="http://IP:3457"
                         className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                       />
                       <button
                         onClick={handleConnect}
                         disabled={!manualUrl.trim() || isConnecting}
                         className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                       >
                         <Check className="w-4 h-4" />
                       </button>
                     </div>
                  )}
               </div>
            )}
            
            {/* Footer Actions */}
            <div className="pt-2 flex justify-end">
                {isConnected && mode !== 'server' && (
                  <button
                    onClick={disconnect}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    Desconectar
                  </button>
                )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;

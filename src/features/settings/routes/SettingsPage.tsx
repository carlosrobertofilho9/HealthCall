import React from 'react';
import { useSettings as useLocalSettings } from '@/features/settings/hooks/useSettings';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useElectron } from '@/hooks/useElectron';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/switch';

/**
 * A página de configurações da aplicação.
 *
 * Este componente permite que os usuários configurem suas preferências, como
 * definir um destino padrão para novos pacientes e escolher se desejam usar
 * a síntese de voz nativa do navegador para os anúncios.
 * Ele utiliza o hook `useSettings` para gerenciar a lógica de carregamento e salvamento
 * do destino padrão.
 *
 * @returns {React.ReactElement} O componente da página de configurações.
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    destinations,
    selected,
    setSelected,
    loading: loadingDestination,
    saving,
    saveDefaultDestination,
  } = useLocalSettings();

  const { useBrowserVoice, setUseBrowserVoice, loading: loadingVoiceSetting } = useSettings();

  const loading = loadingDestination || loadingVoiceSetting;

  return (
    <div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl max-w-xl mx-auto space-y-8">
      <div>
        <h2 className="text-white text-2xl font-bold leading-tight mb-2">Configurações</h2>
        {user && (
          <p className="text-gray-400 text-sm">
            Logado como: <span className="text-[#38e07b] font-medium">{user.name || user.email}</span>
          </p>
        )}
      </div>

      {/* Seção de Status do Servidor */}
      <ServerStatusSection />

      <div className="space-y-6 pt-4 border-t border-white/10">
        <h3 className="text-white text-lg font-semibold">Preferências</h3>
        
        <div>
          <Label htmlFor="default-destination" className="text-white font-medium mb-2 block">
            Setor de Trabalho
          </Label>
          <p className="text-gray-400 text-sm mb-3">
            Selecione o setor onde você trabalha. Este será o destino padrão ao adicionar pacientes.
          </p>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9] z-10">meeting_room</span>
            <Select onValueChange={setSelected} value={selected} disabled={loading}>
              <SelectTrigger id="default-destination" className="bg-[#0d1611] border-white/10 text-white pl-12 h-12">
                <SelectValue placeholder="Nenhum (selecionar ao adicionar)" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#0d1611] p-4 rounded-xl border border-white/5">
          <div className="space-y-1">
            <Label htmlFor="browser-voice-switch" className="text-white font-medium cursor-pointer">
              Usar voz do navegador
            </Label>
            <p className="text-gray-400 text-xs">
              Use a síntese de voz nativa se o áudio do servidor falhar
            </p>
          </div>
          <Switch
            id="browser-voice-switch"
            checked={useBrowserVoice}
            onCheckedChange={setUseBrowserVoice}
            disabled={loading}
          />
        </div>

        <div className="pt-2">
          <Button
            onClick={saveDefaultDestination}
            disabled={saving || loading}
            className="w-full bg-[#38e07b] hover:bg-[#2dc46b] text-[#0a1f12] font-semibold h-12"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente interno para mostrar status do servidor
import { useNetworkSyncContext } from '@/contexts/NetworkSyncContext';

const ServerStatusSection = () => {
  const { mode, localServerInfo, isConnected, forceClientMode, setForceClientMode, connect, isConnecting, syncMode, setSyncMode } = useNetworkSyncContext();
  const { isElectron } = useElectron();
  const [manualIp, setManualIp] = React.useState('');
  
  if (!isElectron) return null;

  const handleManualConnect = () => {
    if (!manualIp) return;
    // Adiciona protocolo e porta se não tiver
    let url = manualIp;
    if (!url.startsWith('http')) {
      url = `http://${url}`;
    }
    if (!url.includes(':')) {
       url = `${url}:3457`;
    }
    connect(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Idealmente mostraria um toast aqui
  };

  return (
    <div className="bg-[#0d1611] rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#38e07b]/10">
            <span className="material-symbols-outlined text-[#38e07b]">dns</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Sincronização Local</h3>
            <p className="text-sm text-gray-400">
              {mode === 'server' ? 'Atuando como Servidor' : 'Atuando como Cliente'}
            </p>
          </div>
        </div>
        
        
        {/* Seletor de Modo de Sincronização */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Modo de Operação</label>
          <div className="flex bg-[#1a2c22] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setSyncMode('server')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                syncMode === 'server' 
                  ? 'bg-[#38e07b] text-[#0d1611] shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Servidor
            </button>
            <button
              onClick={() => setSyncMode('client')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                syncMode === 'client' || syncMode === 'auto'
                  ? 'bg-[#38e07b] text-[#0d1611] shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Cliente
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {syncMode === 'server' 
              ? "Força este computador a ser o Servidor Principal. (Requer reinício)" 
              : "Busca e se conecta a outros servidores na rede. (Requer reinício)"}
          </p>
        </div>
      </div>

      {/* Info do Servidor Local */}
      {mode === 'server' && localServerInfo && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#38e07b] animate-pulse" />
              <span className="text-sm font-medium text-white">Online (Porta {localServerInfo.port})</span>
            </div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Dispositivos Conectados</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#38e07b] text-sm">devices</span>
              <span className="text-sm font-medium text-white">{localServerInfo.clients} cliente(s)</span>
            </div>
          </div>

          <div className="col-span-2 bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Endereços de Conexão (URLs)</p>
            <div className="space-y-1">
              {localServerInfo.addresses.map((addr) => (
                <div key={addr.interface} className="flex justify-between items-center text-sm group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-gray-400 whitespace-nowrap">{addr.interface}:</span>
                    <span className="font-mono text-[#38e07b] bg-[#38e07b]/5 px-2 py-0.5 rounded truncate">
                      {addr.url || `http://${addr.address}:${localServerInfo.port}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(addr.url || `http://${addr.address}:${localServerInfo.port}`)}
                    className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Copiar URL"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Clientes Detalhada */}
          {localServerInfo.clientsList && localServerInfo.clientsList.length > 0 && (
            <div className="col-span-2 bg-black/20 p-3 rounded-lg mt-2">
              <p className="text-xs text-gray-500 mb-2">Lista de Clientes</p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {localServerInfo.clientsList.map((client) => (
                  <div key={client.id} className="flex justify-between items-center text-sm bg-black/20 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#38e07b]" />
                      <span className="font-mono text-gray-300">{client.ip}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Entrou {new Date(client.joinedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info quando em modo cliente forçado ou apenas cliente */}
      {mode !== 'server' && (
         <div className="space-y-4 pt-2">
             <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                 <p className="text-sm text-gray-300">
                     {forceClientMode 
                        ? 'O servidor local está desativado manualmente. Este terminal buscará outros servidores para se conectar.'
                        : 'Buscando servidor na rede ou conectado a um servidor remoto.'}
                 </p>
             </div>
             
             {/* Conexão Manual */}
             <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-3">
               <Label className="text-white text-sm">Conexão Manual</Label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="Ex: 192.168.1.10" 
                   className="flex-1 bg-[#0d1611] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#38e07b]"
                   value={manualIp}
                   onChange={(e) => setManualIp(e.target.value)}
                 />
                 <Button 
                    onClick={handleManualConnect}
                    disabled={isConnecting || !manualIp}
                    className="bg-[#38e07b] hover:bg-[#2dc46b] text-[#0a1f12]"
                 >
                   {isConnecting ? '...' : 'Conectar'}
                 </Button>
               </div>
               <p className="text-xs text-gray-500">
                 Digite o IP do computador servidor. A porta padrão (:3457) será adicionada automaticamente.
               </p>
             </div>

             {isConnected && (
                 <div className="flex items-center gap-2 text-[#38e07b] bg-[#38e07b]/10 p-2 rounded-lg">
                     <span className="material-symbols-outlined text-sm">check_circle</span>
                     <span className="text-sm font-medium">Conectado ao Servidor Mestre</span>
                 </div>
             )}
         </div>
      )}
    </div>
  );
};

export default SettingsPage;

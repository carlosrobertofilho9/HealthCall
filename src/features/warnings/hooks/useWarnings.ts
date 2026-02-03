import { useState, useEffect, useCallback } from 'react';
import { Warning } from '@/types';
import * as localDb from '@/services/localDatabase';
import { syncClient } from '@/services/networkSyncClient';
import { useElectron } from '@/hooks/useElectron';
import { toast } from 'sonner';

export function useWarnings() {
  const { isElectron } = useElectron();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  // Determina se estamos em modo "Cliente de Rede"
  // Se o syncClient estiver conectado a um servidor remoto, usamos ele.
  // Caso contrário, usamos o banco local (IPC).
  const isNetworkMode = !isElectron || syncClient.isConnected();

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true);
      let data: Warning[] = [];
      
      if (isNetworkMode) {
        data = await syncClient.getWarnings();
      } else {
        data = await localDb.getWarnings();
      }
      
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  }, [isNetworkMode]);

  // Listeners para atualizações em tempo real
  useEffect(() => {
    fetchWarnings();

    const handleDataUpdate = (data: { table: string }) => {
      if (data.table === 'warnings') {
        fetchWarnings();
      }
    };

    // Registra nos dois para garantir, o serviço correto responderá
    localDb.onDataUpdate(handleDataUpdate);
    syncClient.on('data_update', handleDataUpdate);
    
    // Também escuta quando a conexão de rede muda
    syncClient.on('connected', fetchWarnings);
    syncClient.on('disconnected', fetchWarnings);

    return () => {
      localDb.offDataUpdate(handleDataUpdate);
      syncClient.off('data_update', handleDataUpdate);
      syncClient.off('connected', fetchWarnings);
      syncClient.off('disconnected', fetchWarnings);
    };
  }, [fetchWarnings]);

  // CRUD Operations
  
  const addWarning = async (warning: Omit<Warning, 'id' | 'created_at'>) => {
    try {
      if (isNetworkMode) {
        await syncClient.fetch('/api/warnings', {
          method: 'POST',
          body: JSON.stringify(warning),
        });
      } else {
        await localDb.addWarning(warning);
      }
      toast.success('Aviso adicionado com sucesso');
      return true;
    } catch (error) {
      console.error('Error adding warning:', error);
      toast.error('Erro ao salvar aviso');
      return false;
    }
  };

  const updateWarning = async (id: string, updates: Partial<Warning>) => {
    try {
      if (isNetworkMode) {
        await syncClient.fetch(`/api/warnings/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } else {
        await localDb.updateWarning(id, updates);
      }
      toast.success('Aviso atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Error updating warning:', error);
      toast.error('Erro ao atualizar aviso');
      return false;
    }
  };

  const removeWarning = async (id: string) => {
    try {
      if (isNetworkMode) {
        await syncClient.fetch(`/api/warnings/${id}`, {
          method: 'DELETE',
        });
      } else {
        await localDb.removeWarning(id);
      }
      toast.success('Aviso removido');
      return true;
    } catch (error) {
      console.error('Error removing warning:', error);
      toast.error('Erro ao remover aviso');
      return false;
    }
  };

  const toggleWarningActive = async (id: string) => {
    try {
      if (isNetworkMode) {
        await syncClient.fetch(`/api/warnings/${id}/toggle`, {
          method: 'POST',
        });
      } else {
        await localDb.toggleWarningActive(id);
      }
      return true;
    } catch (error) {
      console.error('Error toggling warning:', error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  };

  const reorderWarnings = async (orderedIds: string[]) => {
    try {
      if (isNetworkMode) {
        await syncClient.fetch('/api/warnings/reorder', {
          method: 'POST',
          body: JSON.stringify({ ids: orderedIds }),
        });
      } else {
        await localDb.reorderWarnings(orderedIds);
      }
      toast.success('Ordem atualizada');
      return true;
    } catch (error) {
      console.error('Error reordering warnings:', error);
      toast.error('Erro ao atualizar ordem');
      return false;
    }
  };

  const saveWarningMedia = async (file: File) => {
    // Media upload sempre via localDb se estivermos no Electron principal
    // Se estivermos em um cliente remoto, a lógica de upload precisaria de um endpoint no servidor
    if (isNetworkMode) {
        const formData = new FormData();
        formData.append('file', file);
        
        const serverUrl = syncClient.getServerUrl();
        const response = await fetch(`${serverUrl}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Falha no upload para o servidor');
        const data = await response.json();
        return data.url;
    }
    
    return await localDb.saveWarningMedia(file);
  };

  return {
    warnings,
    loading,
    addWarning,
    updateWarning,
    removeWarning,
    toggleWarningActive,
    reorderWarnings,
    saveWarningMedia
  };
}

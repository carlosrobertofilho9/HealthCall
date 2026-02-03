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

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true);
      let data: Warning[] = [];
      
      if (isElectron) {
        data = await localDb.getWarnings();
      } else {
        data = await syncClient.getWarnings();
      }
      
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // Initial fetch and listeners
  useEffect(() => {
    fetchWarnings();

    const handleDataUpdate = (data: { table: string }) => {
      if (data.table === 'warnings') {
        fetchWarnings();
      }
    };

    if (isElectron) {
      localDb.onDataUpdate(handleDataUpdate);
    } else {
      syncClient.on('data_update', handleDataUpdate);
    }

    return () => {
      if (isElectron) {
        localDb.offDataUpdate(handleDataUpdate);
      } else {
        syncClient.off('data_update', handleDataUpdate);
      }
    };
  }, [isElectron, fetchWarnings]);

  // CRUD Operations
  
  const addWarning = async (warning: Omit<Warning, 'id' | 'created_at'>) => {
    try {
      if (isElectron) {
        await localDb.addWarning(warning);
      } else {
        await syncClient.fetch('/api/warnings', {
          method: 'POST',
          body: JSON.stringify(warning),
        });
      }
      // Listener will handle state update
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
      if (isElectron) {
        await localDb.updateWarning(id, updates);
      } else {
        await syncClient.fetch(`/api/warnings/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
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
      if (isElectron) {
        await localDb.removeWarning(id);
      } else {
        await syncClient.fetch(`/api/warnings/${id}`, {
          method: 'DELETE',
        });
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
      if (isElectron) {
        await localDb.toggleWarningActive(id);
      } else {
        await syncClient.fetch(`/api/warnings/${id}/toggle`, {
          method: 'POST',
        });
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
      if (isElectron) {
        await localDb.reorderWarnings(orderedIds);
      } else {
        await syncClient.fetch('/api/warnings/reorder', {
          method: 'POST',
          body: JSON.stringify({ ids: orderedIds }),
        });
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
    if (!isElectron) {
        // Upload via SyncClient for Browser Mode
        // Note: The current syncClient might not have a direct file upload method exposed nicely
        // We'll implemented a basic fetch upload here or rely on localDb if it's just for local electron
        // But since the requirement is to support sync, we need an endpoint.
        // Looking at electron/services/syncServer/routes/warnings.js, line 168 supports upload via /api/upload
        // But `saveWarningMedia` in localDb uses IPC. 
        
        // For now, if we are in browser mode, we might need a specific upload endpoint in syncClient
        // or we just warn it's not fully supported without the backend proxy.
        // However, checking syncClient code wasn't part of the request, but I should try to support it if possible.
        // Let's assume for now we use the localDb abstraction for Electron, 
        // and for browser we might throw or try a direct fetch if the server supports it.
        // Given the file `electron/services/electronSyncClient.js` doesn't show file upload, 
        // we will stick to localDb for electron and maybe alert for browser for now 
        // OR implement a fetch to the sync server.
        
        // Let's look at `useWarnings` implementation again. 
        // `saveWarningMedia` is only called when `file` is present.
        
        // For the sake of this refactor, I will implement a fetch upload if not electron.
         const formData = new FormData();
         formData.append('file', file);
         
         const response = await fetch(`${syncClient.getServerUrl()}/api/upload`, {
             method: 'POST',
             body: formData
         });
         
         if (!response.ok) throw new Error('Upload failed');
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

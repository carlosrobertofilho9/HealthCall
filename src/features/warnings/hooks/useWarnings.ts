import { useState, useEffect } from 'react';
import { syncClient } from '@/services/networkSyncClient';
import { Warning } from '@/types';
import { toast } from 'sonner';

export function useWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const data = await syncClient.getWarnings();
      setWarnings(data);
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
    const handleUpdate = (event: any) => {
      if (event.table === 'warnings') {
        fetchWarnings();
      }
    };
    syncClient.on('data_update', handleUpdate);
    return () => {
      syncClient.off('data_update', handleUpdate);
    };
  }, []);

  const addWarning = async (warning: Partial<Warning>) => {
    try {
      await syncClient.addWarning(warning);
      toast.success('Aviso adicionado com sucesso');
      fetchWarnings();
    } catch (error) {
      console.error('Erro ao adicionar aviso:', error);
      toast.error('Erro ao adicionar aviso');
    }
  };

  const updateWarning = async (id: string, updates: Partial<Warning>) => {
    try {
      await syncClient.updateWarning(id, updates);
      toast.success('Aviso atualizado com sucesso');
      fetchWarnings();
    } catch (error) {
      console.error('Erro ao atualizar aviso:', error);
      toast.error('Erro ao atualizar aviso');
    }
  };

  const removeWarning = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este aviso?')) {
      try {
        await syncClient.removeWarning(id);
        toast.success('Aviso removido com sucesso');
        fetchWarnings();
      } catch (error) {
        console.error('Erro ao remover aviso:', error);
        toast.error('Erro ao remover aviso');
      }
    }
  };

  return {
    warnings,
    loading,
    addWarning,
    updateWarning,
    removeWarning,
    refresh: fetchWarnings
  };
}
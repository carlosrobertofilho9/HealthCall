import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getPendencias } from '../services/pendenciasService';
import type { Pendencia } from '../types';

export const usePendencias = () => {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPendencias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendencias();
      setPendencias(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao carregar pendências'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendencias();

    const channel = supabase
      .channel('pendencias-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pendencias' }, () => {
        fetchPendencias();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendencias]);

  return {
    pendencias,
    loading,
    error,
    refetch: fetchPendencias,
  };
};

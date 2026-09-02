import { useCallback, useEffect, useState } from 'react';
import { subscribeDomain } from '@/lib/apiClient';
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
    void fetchPendencias();
    return subscribeDomain('pendencias', () => void fetchPendencias());
  }, [fetchPendencias]);

  return { pendencias, loading, error, refetch: fetchPendencias };
};

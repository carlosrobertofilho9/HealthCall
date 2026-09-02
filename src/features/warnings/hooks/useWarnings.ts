import { useState, useEffect, useCallback } from 'react';
import type { Warning } from '../types';
import { getWarnings } from '../services/warningsService';
import { subscribeDomain } from '@/lib/apiClient';

export function useWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWarnings();
      setWarnings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar avisos'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWarnings();
    return subscribeDomain('warnings', () => void fetchWarnings());
  }, [fetchWarnings]);

  return { warnings, loading, error, refetch: fetchWarnings };
}

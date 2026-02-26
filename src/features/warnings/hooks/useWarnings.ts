import { useState, useEffect, useCallback } from 'react';
import { Warning } from '../types';
import { getWarnings } from '../services/warningsService';
import { supabase } from '@/lib/supabaseClient';

export function useWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWarnings();
      setWarnings(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarnings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('warnings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warnings' },
        () => {
          fetchWarnings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWarnings]);

  return { warnings, loading, error, refetch: fetchWarnings };
}

import { useState, useEffect, useCallback } from 'react';
import { Warning } from '../types';
import { getWarnings } from '../services/warningsService';
import { supabase } from '@/lib/supabaseClient';

type WarningRow = Partial<Warning> & { id?: string };

function compareWarnings(a: Warning, b: Warning) {
  if (a.priority_order !== b.priority_order) {
    return a.priority_order - b.priority_order;
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function normalizeWarning(row: WarningRow): Warning | null {
  if (!row.id || !row.text || !row.media_type || !row.created_at || typeof row.active !== 'boolean') {
    return null;
  }

  return {
    id: row.id,
    text: row.text,
    background_url: row.background_url ?? null,
    active: row.active,
    created_at: row.created_at,
    media_type: row.media_type,
    qrcode_url: row.qrcode_url ?? null,
    start_time: row.start_time ?? null,
    end_time: row.end_time ?? null,
    audio_url: row.audio_url ?? null,
    duration: row.duration ?? null,
    priority: row.priority ?? false,
    order: row.order ?? null,
    content_url: row.content_url ?? null,
    priority_order: typeof row.priority_order === 'number' ? row.priority_order : 0,
    message: row.message ?? null,
  };
}

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
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const applyRealtimeChange = (eventType: string, newRow?: WarningRow, oldRow?: WarningRow) => {
      setWarnings((current) => {
        if (eventType === 'DELETE' && oldRow?.id) {
          return current.filter((warning) => warning.id !== oldRow.id);
        }

        const normalized = normalizeWarning(newRow ?? oldRow ?? {});
        if (!normalized) {
          return current;
        }

        const withoutCurrent = current.filter((warning) => warning.id !== normalized.id);
        return [...withoutCurrent, normalized].sort(compareWarnings);
      });
    };

    fetchWarnings();

    const channel = supabase
      .channel('warnings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warnings' },
        (payload) => {
          applyRealtimeChange(
            payload.eventType,
            payload.new as WarningRow | undefined,
            payload.old as WarningRow | undefined,
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWarnings]);

  return { warnings, loading, error, refetch: fetchWarnings };
}

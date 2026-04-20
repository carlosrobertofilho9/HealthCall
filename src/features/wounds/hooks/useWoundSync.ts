import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listWoundConflicts, listWoundMutations } from '../services/woundOfflineStore';
import { syncWoundMutationsOnce, type WoundSyncRunResult } from '../services/woundSyncService';
import type { WoundConflict, WoundSyncMutation } from '../types';

interface UseWoundSyncOptions {
  pollIntervalMs?: number;
}

export function useWoundSync(options?: UseWoundSyncOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 15000;
  const timerRef = useRef<number | null>(null);

  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [isSyncing, setIsSyncing] = useState(false);
  const [queue, setQueue] = useState<WoundSyncMutation[]>([]);
  const [conflicts, setConflicts] = useState<WoundConflict[]>([]);
  const [lastRunAt, setLastRunAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshLocalState = useCallback(async () => {
    const [queued, localConflicts] = await Promise.all([
      listWoundMutations(),
      listWoundConflicts(),
    ]);

    setQueue(queued);
    setConflicts(localConflicts);
  }, []);

  const runSync = useCallback(async () => {
    if (!isOnline) return null;

    setIsSyncing(true);
    setLastError(null);

    try {
      const outcome: WoundSyncRunResult = await syncWoundMutationsOnce();
      setLastRunAt(Date.now());

      if (outcome.errors.length > 0) {
        setLastError(outcome.errors[0]);
      }

      await refreshLocalState();
      return outcome;
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Falha ao sincronizar pendências.');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, refreshLocalState]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    void refreshLocalState();
  }, [refreshLocalState]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setInterval(() => {
      void refreshLocalState();
      if (isOnline) {
        void runSync();
      }
    }, pollIntervalMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isOnline, pollIntervalMs, refreshLocalState, runSync]);

  useEffect(() => {
    if (isOnline) {
      void runSync();
    }
  }, [isOnline, runSync]);

  const summary = useMemo(
    () => ({
      pendingCount: queue.length,
      conflictCount: conflicts.length,
      hasPending: queue.length > 0,
      hasConflicts: conflicts.length > 0,
    }),
    [conflicts.length, queue.length],
  );

  return {
    isOnline,
    isSyncing,
    queue,
    conflicts,
    summary,
    lastRunAt,
    lastError,
    refresh: refreshLocalState,
    syncNow: runSync,
  };
}

export default useWoundSync;

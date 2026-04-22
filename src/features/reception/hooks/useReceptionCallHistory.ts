import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { listReceptionCallHistoryByDate } from '../services/receptionService';
import type { ReceptionCallHistoryItem } from '../types';

export function useReceptionCallHistory(selectedDate: Date) {
  const [callHistory, setCallHistory] = useState<ReceptionCallHistoryItem[]>([]);
  const [isLoadingCallHistory, setIsLoadingCallHistory] = useState(true);

  const loadCallHistory = useCallback(async () => {
    try {
      setIsLoadingCallHistory(true);
      const data = await listReceptionCallHistoryByDate(selectedDate);
      setCallHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico de chamadas da recepção:', error);
      toast.error('Não foi possível carregar o histórico de chamadas.');
    } finally {
      setIsLoadingCallHistory(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadCallHistory();

    const channel = supabase
      .channel(`reception-call-history-${selectedDate.toISOString().slice(0, 10)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'display_call_events' }, loadCallHistory)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCallHistory, selectedDate]);

  return {
    callHistory,
    isLoadingCallHistory,
    refreshCallHistory: loadCallHistory,
  };
}

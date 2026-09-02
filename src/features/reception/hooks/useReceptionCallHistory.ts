import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { subscribeHealthCallEvents } from '@/lib/apiClient';
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
    void loadCallHistory();
    return subscribeHealthCallEvents((event) => {
      if (event.type === 'call') void loadCallHistory();
    });
  }, [loadCallHistory]);

  return {
    callHistory,
    isLoadingCallHistory,
    refreshCallHistory: loadCallHistory,
  };
}

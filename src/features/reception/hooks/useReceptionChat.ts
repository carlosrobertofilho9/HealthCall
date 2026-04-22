import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { ensureReceptionChatDailyReset, listReceptionMessages, sendReceptionMessage } from '../services/receptionService';
import type { ReceptionMessage } from '../types';

export function useReceptionChat() {
  const [messages, setMessages] = useState<ReceptionMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listReceptionMessages();
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar mensagens da recepção:', error);
      toast.error('Não foi possível carregar as mensagens da recepção.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeMessages = async () => {
      try {
        await ensureReceptionChatDailyReset();
      } catch (error) {
        console.warn('Não foi possível confirmar a limpeza diária do chat da recepção:', error);
      }

      if (isMounted) {
        await loadMessages();
      }
    };

    initializeMessages();

    const channel = supabase
      .channel('reception-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reception_messages' }, loadMessages)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  const sendMessage = useCallback(async (content: string, senderName?: string | null) => {
    try {
      setIsSending(true);
      await sendReceptionMessage(content, senderName);
    } catch (error) {
      console.error('Erro ao enviar mensagem para a recepção:', error);
      toast.error('Não foi possível enviar a mensagem.');
    } finally {
      setIsSending(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    refresh: loadMessages,
  };
}

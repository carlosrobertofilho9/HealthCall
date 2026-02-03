import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetworkSyncContext } from './NetworkSyncContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  type: 'text' | 'image' | 'system';
  timestamp: number;
  created_at?: string;
}

interface ChatContextType {
  messages: Message[];
  unreadCount: number;
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>;
  clearChat: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { mode, serverUrl } = useNetworkSyncContext();
  const isClient = mode === 'client';

  // Carregar histórico inicial
  const fetchHistory = useCallback(async () => {
    try {
      if ((window as any).electron && (window as any).electron.chat) {
        const result = await (window as any).electron.chat.history(50);
        if (result.success && Array.isArray(result.data)) {
          setMessages(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();

    // Listen for updates
    // Listen for updates
    const handleDataUpdate = (data: { table?: string } | any) => {
       const table = data?.table;
       if (table === 'messages') {
        fetchHistory();
        
        // Se o chat não estiver visível (ou focado), incrementar unread
        // Nota: Idealmente verificaríamos se a ultima mensagem não é nossa
        if (!isOpen || document.visibilityState === 'hidden') {
             setUnreadCount(prev => prev + 1);
             
             // Enviar notificação de sistema
             if ((window as any).electron && (window as any).electron.notification) {
                (window as any).electron.notification.send(
                    'HealthCall Chat', 
                    'Nova mensagem da equipe', 
                    { url: '/chat' } 
                ).catch(console.error);
             }
        }
      }
    };

    if ((window as any).electron) {
      (window as any).electron.on('data:updated', handleDataUpdate);
    }

    return () => {
      if ((window as any).electron) {
        (window as any).electron.off('data:updated', handleDataUpdate);
      }
    };
  }, [fetchHistory, isOpen]);

  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    if (!content.trim()) return;

    try {
      // Use stored user name or prompts? For now, hardcode or use "Atendente"
      // Ideally get from AuthContext
      const sender_name = 'Atendente'; // Placeholder - SHOULD BE FIXED with UserProfileContext

      await (window as any).electron.chat.send({ 
        content, 
        sender_name, 
        type 
      });
      // Optimistic update? No, wait for broadcast to ensure consistency
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const clearChat = async () => {
    if ((window as any).electron && (window as any).electron.chat) {
        await (window as any).electron.chat.clear();
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      unreadCount, 
      sendMessage, 
      clearChat,
      isOpen,
      setIsOpen,
      markAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

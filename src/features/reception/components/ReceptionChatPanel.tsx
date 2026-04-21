import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, MessageCircle } from 'lucide-react';
import { Button, Input, SectionCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string;
  created_at: string;
  profiles?: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

interface ReceptionChatPanelProps {
  messages: Message[];
  sendMessage: (content: string, senderName: string | null) => Promise<void>;
  isSending: boolean;
  profileName: string;
  profileInitials: string;
  userId?: string;
  isLoading: boolean;
  avatarUrl?: string | null;
  className?: string;
}

export const ReceptionChatPanel: React.FC<ReceptionChatPanelProps> = ({
  messages,
  sendMessage,
  isSending,
  profileName,
  profileInitials,
  userId,
  avatarUrl,
  isLoading,
  className,
}) => {
  const [draftMessage, setDraftMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draftMessage.trim()) return;
    await sendMessage(draftMessage, profileName);
    setDraftMessage('');
  };

  return (
    <SectionCard
      title="Chat interno"
      icon={<MessageCircle className="size-5" />}
      className={cn("flex h-full flex-col border-0 shadow-none rounded-none bg-transparent", className)}
      headerClassName="border-border/60 px-4 py-3 shrink-0"
      contentClassName="p-0 flex-1 flex flex-col min-h-0"
    >
      <div className="flex h-full flex-col bg-background/20 relative">
        <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 shrink-0">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Foto de ${profileName}`}
                className="size-9 rounded-full border border-border/70 object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-primary/10 text-xs font-bold text-primary">
                {profileInitials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">{profileName}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Equipe de Recepção</p>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4"
        >
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isMine = userId ? message.sender_id === userId : message.sender_name === profileName;
              
              // Verifica se a mensagem anterior é do mesmo remetente para agrupar
              const isSameSender = prevMessage && 
                (userId 
                  ? prevMessage.sender_id === message.sender_id 
                  : prevMessage.sender_name === message.sender_name);
              
              // Só mostra o nome se não for o mesmo remetente
              const showHeader = !isSameSender;
              const senderName = message.profiles?.full_name || message.sender_name || 'Equipe';
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex flex-col gap-1',
                    isMine ? 'items-end' : 'items-start',
                    isSameSender ? '-mt-2.5' : 'mt-1'
                  )}
                >
                  {showHeader && (
                    <div className={cn(
                      "flex items-center gap-2 mb-0.5 px-1",
                      isMine ? "flex-row-reverse" : "flex-row"
                    )}>
                      {!isMine && <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{senderName}</span>}
                      <span className="text-[9px] text-muted-foreground/60">{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border transition-shadow',
                    isMine 
                      ? 'bg-primary text-primary-foreground border-primary/20' 
                      : 'bg-background border-border/60 text-foreground',
                    isMine && showHeader && 'rounded-tr-none',
                    !isMine && showHeader && 'rounded-tl-none'
                  )}>
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-30 text-center">
              <MessageCircle className="size-10" />
              <p className="text-sm font-medium">Equipe de prontidão</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-border/40 bg-background/40 p-3 shrink-0">
          <Input
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Digite aqui..."
            className="bg-background/80 border-border/40"
            disabled={isSending}
          />
          <Button type="submit" size="sm" disabled={isSending || !draftMessage.trim()}>
            <BellRing className="size-4 mr-1.5" /> Enviar
          </Button>
        </form>
      </div>
    </SectionCard>
  );
};

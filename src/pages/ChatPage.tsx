import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send,  Paperclip, MoreVertical, Phone, Video, Search } from 'lucide-react';
import { useNetworkSyncContext } from '@/contexts/NetworkSyncContext';

const ChatPage: React.FC = () => {
    const { messages, sendMessage, setIsOpen, markAsRead } = useChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { mode } = useNetworkSyncContext();
    const isClient = mode === 'client';

    // Auto-scroll e marcar como lido ao entrar
    useEffect(() => {
        setIsOpen(true);
        markAsRead();
        return () => setIsOpen(false);
    }, [setIsOpen, markAsRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;
        
        await sendMessage(inputValue);
        setInputValue('');
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 p-4 box-border">
            {/* Sidebar (Contacts/List) */}
            <Card className="hidden md:flex flex-col w-80 h-full bg-card border-none shadow-xl rounded-2xl overflow-hidden">
                <div className="p-4 border-b bg-muted/10">
                    <h2 className="text-xl font-bold mb-4">Mensagens</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            placeholder="Buscar conversa..." 
                            className="w-full h-10 rounded-md bg-muted/20 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {/* Active Chat Item */}
                    <div className="flex items-center gap-3 p-4 bg-accent/50 cursor-pointer border-l-4 border-primary transition-all hover:bg-accent/60">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                #
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold truncate">Equipe HealthCall</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Online</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                Canal oficial de comunicação da equipe
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="p-3 bg-muted/20 text-xs text-center text-muted-foreground border-t">
                    Modo: {isClient ? 'Cliente' : 'Servidor'} • v1.0.0
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col h-full border-none shadow-xl rounded-2xl overflow-hidden bg-background">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            #
                        </div>
                        <div>
                            <h2 className="font-bold flex items-center gap-2">
                                Equipe HealthCall
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            </h2>
                            <p className="text-xs text-muted-foreground">Online • {isClient ? 'Cliente' : 'Servidor'}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Phone className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Video className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-zinc-950/30">
                    {messages.length === 0 && (
                        <div className="flex flex-col justify-center items-center h-full text-muted-foreground space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-2xl">👋</span>
                            </div>
                            <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                        </div>
                    )}
                    
                    {messages.map((msg, index) => {
                        const isSystem = msg.type === 'system';
                        // Simple logic for "me" vs "others" - ideally use user ID
                        const isMe = msg.sender_name === 'Atendente'; 
                        const showAvatar = index === 0 || messages[index - 1].sender_name !== msg.sender_name;
                        
                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-4">
                                    <span className="text-xs font-medium bg-muted px-3 py-1.5 rounded-full text-muted-foreground border">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`flex w-full gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 text-gray-700 font-bold text-xs mt-1 ${!showAvatar ? 'opacity-0' : ''}`}>
                                        {getInitials(msg.sender_name)}
                                    </div>
                                )}
                                
                                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showAvatar && !isMe && (
                                        <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.sender_name}</span>
                                    )}
                                    
                                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                        isMe 
                                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                            : 'bg-white dark:bg-zinc-800 border rounded-tl-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    
                                    <span className="text-[10px] text-muted-foreground/70 mt-1 px-1">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>

                                {isMe && (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-primary/20 text-primary font-bold text-xs mt-1 ${!showAvatar ? 'invisible' : ''}`}>
                                        {getInitials('Eu')}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-background border-t">
                    <form onSubmit={handleSend} className="flex gap-3 items-end bg-zinc-100 dark:bg-zinc-900 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 ring-primary/20 transition-all shadow-sm">
                        <button 
                            type="button" 
                            className="flex items-center justify-center rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors mb-0.5"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 min-h-[44px] flex items-center">
                            <input 
                                value={inputValue} 
                                onChange={(e) => setInputValue(e.target.value)} 
                                placeholder="Digite sua mensagem..." 
                                className="w-full bg-transparent border-none focus:outline-none px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                                autoComplete="off"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={!inputValue.trim()} 
                            className={`flex items-center justify-center rounded-full h-10 w-10 mb-0.5 transition-all shadow-md ${
                                inputValue.trim() 
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground transform active:scale-95' 
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                            }`}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default ChatPage;

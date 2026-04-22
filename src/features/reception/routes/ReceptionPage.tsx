import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '@/components/layout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReception } from '../hooks/useReception';

import { ReceptionChatPanel } from '../components/ReceptionChatPanel';
import { ReceptionFlowPanel } from '../components/ReceptionFlowPanel';
import { ReceptionCallHistoryPanel } from '../components/ReceptionCallHistoryPanel';

const ReceptionPage: React.FC = () => {
  usePageTitle('Recepção');
  const { profile } = useUserProfile();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [firstMessageEffectKey, setFirstMessageEffectKey] = useState(0);
  const hasLoadedMessagesRef = useRef(false);
  const previousMessageCountRef = useRef(0);
  const {
    isLoading,
    slots,
    dayConfig,
    selectedDate,
    changeDate,
    goToToday,
    refresh,
    updateStatus,
    todayAppointments,
    getSlotLabel,
    messages,
    sendMessage,
    isSending,
    callHistory,
    isLoadingCallHistory,
    refreshCallHistory,
  } = useReception();

  const profileName = profile?.full_name?.trim() || 'Equipe';
  const profileInitials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((v) => v[0]?.toUpperCase() ?? '')
    .join('') || 'RE';

  const presenceSummary = useMemo(() => {
    const showedUp = todayAppointments.filter((a) => a.status === 'Compareceu').length;
    const noShow = todayAppointments.filter((a) => a.status === 'Faltou').length;
    return { 
      showedUp, 
      noShow, 
      scheduled: todayAppointments.length - showedUp - noShow, 
      total: todayAppointments.length 
    };
  }, [todayAppointments]);

  useEffect(() => {
    if (isLoading) return;

    const previousMessageCount = previousMessageCountRef.current;

    if (!hasLoadedMessagesRef.current) {
      hasLoadedMessagesRef.current = true;
      previousMessageCountRef.current = messages.length;
      setIsChatCollapsed(messages.length === 0);
      return;
    }

    if (messages.length === 0) {
      setIsChatCollapsed(true);
    }

    if (previousMessageCount === 0 && messages.length > 0) {
      setIsChatCollapsed(false);
      setFirstMessageEffectKey((current) => current + 1);
    }

    previousMessageCountRef.current = messages.length;
  }, [isLoading, messages.length]);

  return (
    <PageShell 
      desktopContained 
      mobileContained 
      className="flex flex-col bg-background/30"
    >
      <AnimatePresence>
        {firstMessageEffectKey > 0 && (
          <motion.div
            key={firstMessageEffectKey}
            className="pointer-events-none fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-primary/55 bg-primary/10 shadow-[inset_0_0_80px_hsl(var(--primary)/0.28)]"
              initial={{ scale: 1.015 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute left-1/2 top-6 -translate-x-1/2 rounded-xl border border-primary/35 bg-background/95 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary shadow-2xl backdrop-blur-xl"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-12, 0, 0, -8] }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            >
              Nova mensagem na recepção
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col min-h-0">


        {/* Layout Desktop (3 Colunas) */}
        <div className="hidden lg:flex flex-row flex-1 min-h-0 overflow-hidden divide-x divide-border/40">
          <div className={`${isChatCollapsed ? 'w-[72px]' : 'w-[360px]'} shrink-0 bg-background/20 h-full overflow-hidden transition-[width] duration-300`}>
            <ReceptionChatPanel 
              messages={messages}
              sendMessage={sendMessage}
              isSending={isSending}
              isLoading={isLoading}
              profileName={profileName}
              profileInitials={profileInitials}
              avatarUrl={profile?.avatar_url}
              userId={profile?.id}
              isCollapsed={isChatCollapsed}
              onToggleCollapsed={() => setIsChatCollapsed((current) => !current)}
            />
          </div>
          
          <div className="flex-1 bg-background/10 h-full overflow-hidden">
            <ReceptionFlowPanel 
              todayAppointments={todayAppointments}
              presenceSummary={presenceSummary}
              isLoading={isLoading}
              updateStatus={updateStatus}
              getSlotLabel={getSlotLabel}
              selectedDate={selectedDate}
              changeDate={changeDate}
              goToToday={goToToday}
              refresh={refresh}
              slots={slots}
            />
          </div>

          <div className="w-[340px] shrink-0 bg-background/20 h-full overflow-hidden">
            <ReceptionCallHistoryPanel
              callHistory={callHistory}
              selectedDate={selectedDate}
              dayConfig={dayConfig}
              isLoading={isLoadingCallHistory}
              onRefresh={refreshCallHistory}
            />
          </div>
        </div>

        {/* Layout Mobile/Tablet (Tabs) */}
        <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="flow" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border/40 bg-background/40">
              <TabsTrigger value="chat" className="text-xs font-bold">CHAT</TabsTrigger>
              <TabsTrigger value="flow" className="text-xs font-bold">FLUXO</TabsTrigger>
              <TabsTrigger value="calls" className="text-xs font-bold">HISTÓRICO</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
            <ReceptionChatPanel 
              messages={messages}
              sendMessage={sendMessage}
              isSending={isSending}
              isLoading={isLoading}
              profileName={profileName}
              profileInitials={profileInitials}
              avatarUrl={profile?.avatar_url}
              userId={profile?.id}
              isCollapsed={isChatCollapsed}
              onToggleCollapsed={() => setIsChatCollapsed((current) => !current)}
            />
            </TabsContent>
            
            <TabsContent value="flow" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
              <ReceptionFlowPanel 
                todayAppointments={todayAppointments}
                presenceSummary={presenceSummary}
                isLoading={isLoading}
                updateStatus={updateStatus}
                getSlotLabel={getSlotLabel}
                selectedDate={selectedDate}
                changeDate={changeDate}
                goToToday={goToToday}
                refresh={refresh}
                slots={slots}
              />
            </TabsContent>
            
            <TabsContent value="calls" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
              <ReceptionCallHistoryPanel
                callHistory={callHistory}
                selectedDate={selectedDate}
                dayConfig={dayConfig}
                isLoading={isLoadingCallHistory}
                onRefresh={refreshCallHistory}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
};

export default ReceptionPage;

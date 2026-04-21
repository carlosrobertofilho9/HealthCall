import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { PageShell } from '@/components/layout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReception } from '../hooks/useReception';

// Novos componentes especializados
import { ReceptionChatPanel } from '../components/ReceptionChatPanel';
import { ReceptionFlowPanel } from '../components/ReceptionFlowPanel';
import { ReceptionCallPanel } from '../components/ReceptionCallPanel';

const ReceptionPage: React.FC = () => {
  usePageTitle('Recepção');
  const { profile } = useUserProfile();
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
    waitingQueue,
    getSlotLabel,
    messages,
    sendMessage,
    isSending,
    callNextPatient,
    lastCall,
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

  const nextTwoPatients = waitingQueue.slice(0, 2);

  return (
    <PageShell 
      desktopContained 
      mobileContained 
      className="flex flex-col bg-background/30"
    >
      <div className="flex-1 flex flex-col min-h-0">


        {/* Layout Desktop (3 Colunas) */}
        <div className="hidden lg:flex flex-row flex-1 min-h-0 overflow-hidden divide-x divide-border/40">
          <div className="w-[360px] shrink-0 bg-background/20 h-full overflow-hidden">
            <ReceptionChatPanel 
              messages={messages}
              sendMessage={sendMessage}
              isSending={isSending}
              isLoading={isLoading}
              profileName={profileName}
              profileInitials={profileInitials}
              avatarUrl={profile?.avatar_url}
              userId={profile?.id}
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
            <ReceptionCallPanel 
              lastCall={lastCall}
              nextTwoPatients={nextTwoPatients}
              selectedDate={selectedDate}
              dayConfig={dayConfig}
              getSlotLabel={getSlotLabel}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Layout Mobile/Tablet (Tabs) */}
        <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="flow" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border/40 bg-background/40">
              <TabsTrigger value="chat" className="text-xs font-bold">CHAT</TabsTrigger>
              <TabsTrigger value="flow" className="text-xs font-bold">FLUXO</TabsTrigger>
              <TabsTrigger value="calls" className="text-xs font-bold">PAINEL</TabsTrigger>
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
              <ReceptionCallPanel 
                lastCall={lastCall}
                nextTwoPatients={nextTwoPatients}
                selectedDate={selectedDate}
                dayConfig={dayConfig}
                getSlotLabel={getSlotLabel}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
};

export default ReceptionPage;

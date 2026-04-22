import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDisplayData } from '@/hooks/useDisplayData';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AudioActivationScreen } from '../components/AudioActivationScreen';
import { CallHistorySidebar } from '../components/CallHistorySidebar';
import { CallingOverlay } from '../components/CallingOverlay';
import { DisplayHeader } from '../components/DisplayHeader';
import { NextPatientsFooter } from '../components/NextPatientsFooter';
import { PatientCallArea } from '../components/PatientCallArea';
import { WarningPlayer } from '../components/WarningPlayer';
import { DISPLAY_CLASS } from '../utils/displayTheme';

const DisplayPage: React.FC = () => {
  usePageTitle('Display');

  const {
    calledPatient,
    nextPatients,
    scheduledAppointmentsAwaitingCheckIn,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
    isActivatingAudio,
    showWarnings,
  } = useDisplayData();

  const { session, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={DISPLAY_CLASS.pageCentered}>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#FFFFFF_0%,#F4F6F8_52%,#EAF3FF_100%)]" />
        <div className={cn('relative z-10 flex max-w-md flex-col items-center p-8 text-center', DISPLAY_CLASS.panel)}>
          <LoaderCircle className="mb-5 h-10 w-10 animate-spin text-[#00BB94]" aria-hidden="true" />
          <h1 className="text-3xl font-black">Carregando display</h1>
          <p className={`mt-3 text-base font-medium ${DISPLAY_CLASS.textMuted}`}>Verificando autenticação.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    navigate('/auth/login?redirect=/display');
    return null;
  }

  if (!audioActivated) {
    return <AudioActivationScreen onActivate={activateAudio} isActivating={isActivatingAudio} />;
  }

  const patientName = calledPatient?.name || 'Aguardando chamada...';
  const room = calledPatient?.destination || '-';

  return (
    <div className={DISPLAY_CLASS.page} style={{ fontFamily: '"Inter", "Noto Sans", sans-serif' }}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#FFFFFF_0%,#F4F6F8_45%,#EAF3FF_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/90 to-transparent" />
      <WarningPlayer enabled={showWarnings} paused={isCalling || !showWarnings} />

      <div className="relative z-10 flex h-full max-h-dvh flex-col overflow-hidden p-3 sm:p-4 lg:p-5">
        <DisplayHeader
          queueCount={nextPatients.length}
          scheduledCount={scheduledAppointmentsAwaitingCheckIn.length}
          historyCount={callHistory.length}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-3 pt-3 sm:gap-4 sm:pt-4 lg:gap-5 lg:pt-5">
          <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden sm:gap-4 lg:grid-cols-[minmax(0,2.15fr)_minmax(22rem,0.85fr)] lg:gap-5">
            <PatientCallArea calledPatient={calledPatient} />
            <div className="hidden min-h-0 lg:block">
              <CallHistorySidebar callHistory={callHistory} calledPatient={calledPatient} />
            </div>
          </section>

          <NextPatientsFooter
            nextPatients={nextPatients}
            scheduledAppointmentsAwaitingCheckIn={scheduledAppointmentsAwaitingCheckIn}
          />
        </main>
      </div>

      <CallingOverlay visible={isCalling} patientName={patientName} room={room} />
    </div>
  );
};

export default DisplayPage;

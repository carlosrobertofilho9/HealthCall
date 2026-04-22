import React from 'react';
import { useNavigate } from 'react-router-dom';
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
        <h1 className="text-4xl mb-8">Carregando...</h1>
        <p className={`mt-4 ${DISPLAY_CLASS.textMuted}`}>Verificando autenticação.</p>
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
      <WarningPlayer enabled={showWarnings} paused={isCalling || !showWarnings} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <DisplayHeader />

        <main className="flex-grow p-6 md:p-10 w-full flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-grow">
            <PatientCallArea calledPatient={calledPatient} />
            <CallHistorySidebar callHistory={callHistory} calledPatient={calledPatient} />
          </div>

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

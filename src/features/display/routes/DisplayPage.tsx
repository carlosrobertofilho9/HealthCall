import React from 'react';
import { useDisplayData } from '@/hooks/useDisplayData';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { WarningPlayer } from '../components/WarningPlayer';
import { AudioActivationScreen } from '../components/AudioActivationScreen';
import { CallingOverlay } from '../components/CallingOverlay';
import { DisplayHeader } from '../components/DisplayHeader';
import { PatientCallArea } from '../components/PatientCallArea';
import { CallHistorySidebar } from '../components/CallHistorySidebar';
import { NextPatientsFooter } from '../components/NextPatientsFooter';

/**
 * A página de exibição pública para chamadas de pacientes.
 *
 * Este componente é o ponto de entrada do display/painel mostrado em TVs ou monitores
 * na sala de espera. Compõe os sub-componentes especializados e gerencia as telas
 * condicionais (loading, auth, ativação de áudio, chamada ativa).
 */
const DisplayPage: React.FC = () => {
  usePageTitle();
  const {
    calledPatient,
    nextPatients,
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
      <div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
        <h1 className="text-4xl mb-8">Carregando...</h1>
        <p className="mt-4 text-gray-400">Verificando autenticação.</p>
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

  if (isCalling) {
    const patientName = calledPatient?.name || 'Aguardando chamada...';
    const room = calledPatient?.destination || '-';
    return <CallingOverlay patientName={patientName} room={room} />;
  }

  return (
    <div className="bg-gray-900 text-white relative overflow-hidden" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      {showWarnings && <WarningPlayer onFinish={() => {}} />}

      <div className="flex flex-col min-h-screen relative z-10">
        <DisplayHeader />
        <main className="flex-grow p-6 md:p-10 w-full flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-grow">
            <PatientCallArea calledPatient={calledPatient} />
            <CallHistorySidebar callHistory={callHistory} calledPatient={calledPatient} />
          </div>
          <NextPatientsFooter nextPatients={nextPatients} />
        </main>
      </div>
    </div>
  );
};

export default DisplayPage;

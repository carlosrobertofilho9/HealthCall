import React from 'react';
import { useDisplayData } from '@/hooks/useDisplayData';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';

const DisplayPage: React.FC = () => {
  usePageTitle();
  const {
    calledPatient,
    nextPatients,
    callHistory,
    isCalling,
    audioActivated,
    activateAudio,
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
    return (
      <div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl mb-4">Bem-vindo à Tela de Chamadas</h1>
          <p className="text-lg text-gray-400 mb-8">
            Para garantir que os alertas sonoros funcionem, o navegador exige uma interação inicial.
          </p>
          <button
            onClick={activateAudio}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            <span className="material-symbols-outlined align-middle mr-2">volume_up</span>
            Ativar Som e Iniciar
          </button>
        </div>
      </div>
    );
  }

  const patientName = calledPatient?.name || 'Aguardando chamada...';
  const room = calledPatient?.destination || '-';

  if (isCalling) {
    return (
      <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        <div className="flex flex-col min-h-screen">
          <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-3">
              <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
            </div>
          </header>
          <main className="flex-grow flex flex-col justify-center items-center text-center p-8">
            <div className="animate-slide-in w-full max-w-4xl">
              <h2 className="text-6xl md:text-7xl font-bold text-[#38e07b] mb-4">Chamando</h2>
              <p className="text-7xl md:text-8xl font-black mb-6">{patientName}</p>
              <div className="inline-flex items-center gap-4 bg-gray-800 rounded-full px-8 py-4">
                <span className="material-symbols-outlined text-5xl text-[#38e07b]">meeting_room</span>
                <p className="text-6xl md:text-7xl font-bold">{room}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
          </div>
        </header>
        <main className="flex-grow p-6 md:p-10 w-full flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-grow">
            <div className="md:col-span-2 bg-gray-800 rounded-2xl p-8 text-center flex flex-col justify-center animate-slide-in">
              <h2 className="text-4xl md:text-5xl font-bold text-[#38e07b] mb-4">
                {calledPatient ? 'Chamado' : 'Aguardando chamada'}
              </h2>
              <p className="text-5xl md:text-6xl font-black mb-6">{patientName}</p>
              <div className="inline-flex items-center justify-center gap-4 bg-gray-700 rounded-full px-8 py-4">
                <span className="material-symbols-outlined text-4xl md:text-5xl text-[#38e07b]">meeting_room</span>
                <p className="text-4xl md:text-5xl font-bold">{room}</p>
              </div>
            </div>
            <aside className="bg-gray-800 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Histórico de Chamadas</h3>
              </div>
              <div className="space-y-3 pr-2 flex-grow">
                {callHistory.slice(0, 5).length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Nenhuma chamada registrada.</p>
                  </div>
                )}
                {callHistory.slice(0, 5).map((rec, idx) => (
                  <div
                    key={`${rec.id}-${rec.callCount}-${rec.calledAt}`}
                    className={`p-4 rounded-lg transition-all duration-300 ${
                      idx === 0
                        ? 'bg-green-800/50 border border-green-600 shadow-lg'
                        : 'bg-gray-700/60 hover:bg-gray-700/90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-green-400">
                          {idx === 0 ? 'campaign' : 'history'}
                        </span>
                        <div>
                          <p className="font-bold text-white">{rec.name}</p>
                          <p className="text-sm text-gray-300">{rec.destination}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-300">
                          {new Date(rec.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="text-xs text-gray-400">{rec.callCount}ª chamada</span>
                      </div>
                    </div>
                    {idx === 0 && calledPatient && (
                      <div className="mt-2 text-center">
                        <p className="text-sm font-semibold text-green-300 animate-pulse">Chamado</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </div>
          <section className="mt-8 bg-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Próximos pacientes</h3>
            {nextPatients.slice(0, 3).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nextPatients.slice(0, 3).map((p) => (
                  <div key={p.id} className="bg-gray-700 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-gray-300">{p.destination}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#38e07b]">chevron_right</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300">Não há pacientes na fila de espera.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default DisplayPage;

import React from 'react';
import { useDisplay } from '@/features/display/hooks/useDisplay';
import { usePageTitle } from '@/hooks/usePageTitle';
import { WarningOverlay } from '@/features/display/components/WarningOverlay';
import { NewsTicker } from '@/features/display/components/NewsTicker';
import { NewsHeadline } from '@/features/display/components/NewsHeadline';
import headerLogo from '@/assets/healthcall-logo-header.png';

/**
 * A página de exibição pública para chamadas de pacientes.
 *
 * Este componente renderiza a interface principal que seria mostrada em uma TV ou monitor
 * em uma área de espera. Ele exibe o paciente que está sendo chamado, um histórico de chamadas recentes
 * e os próximos pacientes na fila. O componente também lida com a ativação de áudio,
 * que é uma exigência do navegador para reproduzir som.
 *
 * @returns {React.ReactElement} O componente da página de exibição.
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
    activeWarning,
    shouldShowHeadline,
    handleNewsCycleComplete,
    handleVideoEnd,
  } = useDisplay();

  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
            disabled={isActivatingAudio}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isActivatingAudio ? (
              <>
                <span className="material-symbols-outlined align-middle mr-2 animate-spin">refresh</span>
                Ativando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined align-middle mr-2">volume_up</span>
                Ativar Som e Iniciar
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const patientName = calledPatient?.name || 'Aguardando chamada...';
  const room = calledPatient?.destination || '-';

  // Render Logic
  // 1. Call Screen (Highest Priority, No Ticker)
  // Unified render structure - keeps NewsTicker mounted at all times
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Main Content Area - changes based on state */}
      <div className="absolute inset-0">
        {isCalling ? (
          // Call Screen
          <div className="bg-gray-900 text-white h-full" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
            <div className="flex flex-col h-full">
              <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img src={headerLogo} alt="HealthCall Logo" className="h-6 sm:h-8 w-auto" />
                  <h1 className="text-base sm:text-lg md:text-xl font-bold truncate max-w-[200px] sm:max-w-none">PSF Maria Lucia da Silva</h1>
                </div>
              </header>
              <main className="flex-grow flex flex-col justify-center items-center text-center p-4 sm:p-6 md:p-8">
                <div className="animate-slide-in w-full max-w-4xl px-2">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#38e07b] mb-2 sm:mb-4">Chamando</h2>
                  <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 break-words hyphens-auto">{patientName}</p>
                  <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-4 bg-gray-800 rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4">
                    <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl text-[#38e07b]">meeting_room</span>
                    <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">{room}</p>
                  </div>
                </div>
              </main>
            </div>
          </div>
        ) : activeWarning ? (
          // Warning Screen
          <WarningOverlay warning={activeWarning} time={time} onVideoEnd={handleVideoEnd} />
        ) : shouldShowHeadline ? (
          // News Headline Screen (idle + no warnings)
          <NewsHeadline time={time} onCycleComplete={handleNewsCycleComplete} />
        ) : (
          // List Screen
          <div className="bg-gray-900 text-white h-full flex flex-col" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
            <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <img src={headerLogo} alt="HealthCall Logo" className="h-6 sm:h-8 w-auto" />
                <h1 className="text-base sm:text-lg md:text-xl font-bold truncate max-w-[200px] sm:max-w-none">PSF Maria Lucia da Silva</h1>
              </div>
            </header>
            <main className="flex-grow p-3 sm:p-4 md:p-6 lg:p-10 w-full flex flex-col overflow-auto pb-16 sm:pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch flex-grow">
                <div className="lg:col-span-2 bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center flex flex-col justify-center animate-slide-in">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#38e07b] mb-2 sm:mb-4">
                    {calledPatient ? 'Chamado' : 'Aguardando chamada'}
                  </h2>
                  <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6 break-words hyphens-auto">{patientName}</p>
                  <div className="inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 bg-gray-700 rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4">
                    <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#38e07b]">meeting_room</span>
                    <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">{room}</p>
                  </div>
                </div>
                <aside className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col max-h-[40vh] lg:max-h-none">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold">Histórico de Chamadas</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3 pr-2 flex-grow overflow-y-auto">
                    {callHistory.slice(0, 5).length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">Nenhuma chamada registrada.</p>
                      </div>
                    )}
                    {callHistory.slice(0, 5).map((rec, idx) => (
                      <div
                        key={`${rec.id}-${rec.callCount}-${rec.calledAt}`}
                        className={`p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                          idx === 0
                            ? 'bg-green-800/50 border border-green-600 shadow-lg'
                            : 'bg-gray-700/60 hover:bg-gray-700/90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <span className="material-symbols-outlined text-xl sm:text-2xl text-green-400 shrink-0">
                              {idx === 0 ? 'campaign' : 'history'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white text-sm sm:text-base truncate">{rec.name}</p>
                              <p className="text-xs sm:text-sm text-gray-300 truncate">{rec.destination}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-semibold text-green-300">
                              {new Date(rec.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <span className="text-xs text-gray-400">{rec.callCount}ª chamada</span>
                          </div>
                        </div>
                        {idx === 0 && calledPatient && (
                          <div className="mt-2 text-center">
                            <p className="text-xs sm:text-sm font-semibold text-green-300 animate-pulse">Chamado</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
              <section className="mt-4 sm:mt-6 md:mt-8 bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Próximos pacientes</h3>
                {nextPatients.slice(0, 3).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {nextPatients.slice(0, 3).map((p) => (
                      <div key={p.id} className="bg-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{p.name}</p>
                          <p className="text-xs sm:text-sm text-gray-300 truncate">{p.destination}</p>
                        </div>
                        <span className="material-symbols-outlined text-[#38e07b] shrink-0">chevron_right</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm sm:text-base">Não há pacientes na fila de espera.</p>
                )}
              </section>
            </main>
          </div>
        )}
      </div>

      {/* News Ticker - Always mounted, only hidden during calls */}
      {!isCalling && <NewsTicker />}
    </div>
  );
};

export default DisplayPage;

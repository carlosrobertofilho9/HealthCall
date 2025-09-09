import React, { useState, useEffect, useRef } from 'react';
import type { Patient } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const DisplayPage: React.FC = () => {
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [nextPatients, setNextPatients] = useState<Patient[]>([]);
  const [isReady, setIsReady] = useState(false); // Estado para controlar a permissão de áudio
  const { speak } = useSpeechSynthesis();
  const lastCalledRef = useRef<{ id: number; callCount: number } | null>(null);

  // Função para iniciar o áudio com interação do usuário
  const handleStart = () => {
    setIsReady(true);
    // Toca um som silencioso para "acordar" o contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  };

  useEffect(() => {
    if (!isReady) return; // Não faz nada se o usuário ainda não clicou em "Play"

    const playBellAndSpeak = (patient: Patient) => {
      const bell = new Audio('/bell.mp3');
      bell.play().catch(error => console.error("Erro ao tocar o som da campainha:", error));
      bell.onended = () => {
        const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;
        speak(textToSpeak);
      };
    };

    const updateDisplay = () => {
      const storedCalledPatient = localStorage.getItem('calledPatient');
      const storedNextPatients = localStorage.getItem('nextPatients');

      if (storedCalledPatient) {
        const patient: Patient = JSON.parse(storedCalledPatient);
        
        if (
          patient.id !== lastCalledRef.current?.id ||
          patient.callCount !== lastCalledRef.current?.callCount
        ) {
          setCalledPatient(patient);
          playBellAndSpeak(patient);
          lastCalledRef.current = { id: patient.id, callCount: patient.callCount };
        }
      }
      if (storedNextPatients) {
        setNextPatients(JSON.parse(storedNextPatients));
      }
    };

    // Carrega os dados iniciais sem tocar o som
    const initialLoad = () => {
        const storedCalledPatient = localStorage.getItem('calledPatient');
        const storedNextPatients = localStorage.getItem('nextPatients');
        if (storedCalledPatient) setCalledPatient(JSON.parse(storedCalledPatient));
        if (storedNextPatients) setNextPatients(JSON.parse(storedNextPatients));
    };
    
    initialLoad();

    window.addEventListener('storage', updateDisplay);

    return () => {
      window.removeEventListener('storage', updateDisplay);
    };
  }, [isReady, speak]);

  const patientName = calledPatient?.name || "Aguardando chamada...";
  const room = calledPatient?.destination || "-";
  const nextPatientNames = nextPatients.map(p => p.name);

  if (!isReady) {
    return (
      <div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
        <h1 className="text-4xl mb-8">Tela de Chamada de Pacientes</h1>
        <button
          onClick={handleStart}
          className="bg-[#38e07b] text-gray-900 font-bold text-2xl px-12 py-6 rounded-lg shadow-lg hover:bg-green-400 transition-transform transform hover:scale-105"
        >
          ▶ Iniciar Tela
        </button>
        <p className="mt-4 text-gray-400">Clique para habilitar o som</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <svg className="text-[#38e07b]" fill="none" height="24" viewBox="0 0 48 48" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
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
        <footer className="bg-gray-800 w-full overflow-hidden">
          <div className="flex items-center gap-12 p-4 animate-marquee">
            {nextPatientNames.length > 0 ? (
              <>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="font-semibold text-lg">Próximos:</span>
                  <p className="text-lg text-gray-300">{nextPatientNames[0]}</p>
                </div>
                {nextPatientNames.slice(1).map((name, index) => (
                  <React.Fragment key={index}>
                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    <p className="text-lg text-gray-300">{name}</p>
                  </React.Fragment>
                ))}
                {/* Duplicado para letreiro contínuo */}
                <div className="flex items-center gap-4 flex-shrink-0 pl-12">
                    <span className="font-semibold text-lg">Próximos:</span>
                    <p className="text-lg text-gray-300">{nextPatientNames[0]}</p>
                </div>
                {nextPatientNames.slice(1).map((name, index) => (
                    <React.Fragment key={`dup-${index}`}>
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <p className="text-lg text-gray-300">{name}</p>
                    </React.Fragment>
                ))}
              </>
            ) : (
              <p className="text-lg text-gray-300">Não há pacientes na fila de espera.</p>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DisplayPage;

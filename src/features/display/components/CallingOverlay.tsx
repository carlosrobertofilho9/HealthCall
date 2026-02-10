import React from 'react';
import { DisplayHeader } from './DisplayHeader';

interface CallingOverlayProps {
  patientName: string;
  room: string;
}

/**
 * Overlay fullscreen exibido durante a chamada ativa de um paciente.
 * Mostra nome do paciente e destino em tamanho grande para visibilidade máxima.
 */
export const CallingOverlay: React.FC<CallingOverlayProps> = ({ patientName, room }) => (
  <div className="bg-gray-900 text-white relative" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
    <div className="flex flex-col min-h-screen relative z-50 bg-gray-900">
      <DisplayHeader />
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

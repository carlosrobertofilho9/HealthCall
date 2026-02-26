import React from 'react';

interface CallingOverlayProps {
  visible: boolean;
  patientName: string;
  room: string;
}

export const CallingOverlay: React.FC<CallingOverlayProps> = ({ visible, patientName, room }) => {
  return (
    <div
      className={`absolute inset-0 z-50 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm" />

      <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-6xl md:text-7xl font-black text-[#38e07b] uppercase tracking-[0.1em] mb-6">Chamando</h2>
        <p className="text-6xl md:text-8xl font-black mb-8 max-w-6xl leading-[1.05]">{patientName}</p>

        <div className="inline-flex items-center gap-4 bg-gray-800 rounded-full px-8 py-4 border border-white/10 shadow-2xl">
          <span className="material-symbols-outlined text-5xl text-[#38e07b]">meeting_room</span>
          <p className="text-5xl md:text-7xl font-black">{room}</p>
        </div>
      </div>
    </div>
  );
};

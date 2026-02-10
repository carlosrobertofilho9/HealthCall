import React from 'react';
import { Patient } from '@/types';

interface PatientCallAreaProps {
  calledPatient: Patient | null;
}

/**
 * Área principal do display mostrando o paciente chamado ou "Aguardando chamada".
 */
export const PatientCallArea: React.FC<PatientCallAreaProps> = ({ calledPatient }) => {
  const patientName = calledPatient?.name || 'Aguardando chamada...';
  const room = calledPatient?.destination || '-';

  return (
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
  );
};

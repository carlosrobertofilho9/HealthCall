import React from 'react';
import { Patient } from '@/types';

interface NextPatientsFooterProps {
  nextPatients: Patient[];
}

/**
 * Footer mostrando os próximos 3 pacientes na fila de espera.
 * Gerencia expectativas dos pacientes na sala de espera.
 */
export const NextPatientsFooter: React.FC<NextPatientsFooterProps> = ({ nextPatients }) => {
  const upcoming = nextPatients.slice(0, 3);

  return (
    <section className="mt-8 bg-gray-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4">Próximos pacientes</h3>
      {upcoming.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((p) => (
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
  );
};

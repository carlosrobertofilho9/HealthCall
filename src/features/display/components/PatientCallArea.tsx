import React from 'react';
import { Patient } from '@/types';
import { cn } from '@/lib/utils';
import { getDestinationPresentation } from '@/features/display/utils/displayPresentation';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface PatientCallAreaProps {
  calledPatient: Patient | null;
}

/**
 * Área principal do display mostrando o paciente chamado ou "Aguardando chamada".
 */
export const PatientCallArea: React.FC<PatientCallAreaProps> = ({ calledPatient }) => {
  const patientName = calledPatient?.name || 'Aguardando chamada...';
  const room = calledPatient?.destination || '-';
  const presentation = getDestinationPresentation(calledPatient?.destination);

  return (
    <div
      data-destination-kind={presentation.kind}
      className={cn('md:col-span-2 p-8 text-center flex flex-col justify-center animate-slide-in', DISPLAY_CLASS.panel)}
    >
      <h2 className={cn('text-4xl md:text-5xl font-bold mb-4', presentation.accentTextClassName)}>
        {calledPatient ? 'Chamado' : 'Aguardando chamada'}
      </h2>
      <p className="text-5xl md:text-6xl font-black mb-6">{patientName}</p>
      <div
        className={cn(
          DISPLAY_CLASS.destinationPill,
          presentation.accentBgClassName,
          presentation.borderClassName
        )}
      >
        <span className={cn('material-symbols-outlined text-4xl md:text-5xl', presentation.accentTextClassName)}>
          {presentation.icon}
        </span>
        <div className="min-w-0 text-left">
          {calledPatient && (
            <p className={cn('text-xs md:text-sm font-bold uppercase tracking-[0.16em]', presentation.accentTextClassName)}>
              {presentation.eyebrow}
            </p>
          )}
          <p className="text-3xl md:text-5xl font-bold break-words leading-tight">{room}</p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { BellRing, Radio, UserRoundCheck } from 'lucide-react';
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
  const room = calledPatient?.destination || 'Fila em monitoramento';
  const presentation = getDestinationPresentation(calledPatient?.destination);
  const DestinationIcon = presentation.Icon;

  return (
    <article
      data-destination-kind={presentation.kind}
      className={cn(
        'relative flex h-full min-h-0 overflow-hidden p-4 animate-slide-in sm:p-5 lg:p-7 xl:p-8',
        DISPLAY_CLASS.heroPanel
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#00BB94_0%,#1466F5_100%)]" />
      <div className="flex min-h-0 w-full flex-col justify-between gap-4 sm:gap-5 lg:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={DISPLAY_CLASS.statusBadge}>
            {calledPatient ? (
              <BellRing className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Radio className="h-4 w-4" aria-hidden="true" />
            )}
            {calledPatient ? 'Chamada ativa' : 'Operação em espera'}
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[#E5ECF3] bg-[#F8FAFC] px-4 py-2 text-sm font-bold text-[#64748B] sm:flex">
            <UserRoundCheck className="h-4 w-4 text-[#1466F5]" aria-hidden="true" />
            Atualização em tempo real
          </div>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
          <p
            className={cn(
              'text-sm font-black uppercase text-[#64748B] sm:text-base',
              calledPatient && presentation.accentTextClassName
            )}
          >
            {calledPatient ? 'Paciente chamado' : 'Tela de chamadas'}
          </p>
          <h2 className="mt-3 max-w-full text-[clamp(2.75rem,7vw,6.5rem)] font-black leading-[0.96] text-[#001B3D] lg:mt-4">
            <span className="break-words">{patientName}</span>
          </h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-[#64748B] sm:text-lg lg:mt-4 xl:text-xl">
            {calledPatient
              ? 'Dirija-se ao local indicado abaixo.'
              : 'Acompanhe o painel e aguarde sua chamada sonora.'}
          </p>
        </div>

        <div
          className={cn(
            'mx-auto w-full max-w-4xl',
            DISPLAY_CLASS.destinationPill,
            presentation.accentBgClassName,
            presentation.borderClassName
          )}
        >
          <div className={cn(DISPLAY_CLASS.iconTile, presentation.accentTextClassName)}>
            <DestinationIcon className="h-6 w-6 lg:h-7 lg:w-7" aria-hidden="true" />
          </div>
          <div className="min-w-0 text-left">
            <p className={cn('text-xs font-black uppercase sm:text-sm', presentation.accentTextClassName)}>
              {calledPatient ? presentation.eyebrow : 'Status do display'}
            </p>
            <p className="mt-1 break-words text-2xl font-black leading-tight text-[#001B3D] sm:text-4xl xl:text-5xl">{room}</p>
          </div>
        </div>
      </div>
    </article>
  );
};

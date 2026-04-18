import React from 'react';
import { cn } from '@/lib/utils';
import { getDestinationPresentation } from '@/features/display/utils/displayPresentation';

interface CallingOverlayProps {
  visible: boolean;
  patientName: string;
  room: string;
}

export const CallingOverlay: React.FC<CallingOverlayProps> = ({ visible, patientName, room }) => {
  const presentation = getDestinationPresentation(room);

  return (
    <div
      data-testid="calling-overlay"
      data-destination-kind={presentation.kind}
      className={`absolute inset-0 z-50 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className={cn('absolute inset-0 backdrop-blur-sm', presentation.overlayClassName)} />

      <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-8">
        <h2 className={cn('text-6xl md:text-7xl font-black uppercase tracking-[0.1em] mb-6', presentation.accentTextClassName)}>
          Chamando
        </h2>
        <p className="text-6xl md:text-8xl font-black mb-8 max-w-6xl leading-[1.05]">{patientName}</p>

        <div
          data-testid="calling-destination"
          data-destination-kind={presentation.kind}
          className={cn(
            'inline-flex max-w-full flex-col items-center gap-2 rounded-full px-8 py-4 border shadow-2xl sm:flex-row sm:gap-4',
            presentation.accentBgClassName,
            presentation.borderClassName
          )}
        >
          <span className={cn('material-symbols-outlined text-5xl', presentation.accentTextClassName)}>
            {presentation.icon}
          </span>
          <div className="min-w-0">
            <p className={cn('text-sm md:text-base font-bold uppercase tracking-[0.18em]', presentation.accentTextClassName)}>
              {presentation.eyebrow}
            </p>
            <p className="text-4xl md:text-7xl font-black break-words leading-tight">{room}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

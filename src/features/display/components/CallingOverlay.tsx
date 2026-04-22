import React from 'react';
import { BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDestinationPresentation } from '@/features/display/utils/displayPresentation';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface CallingOverlayProps {
  visible: boolean;
  patientName: string;
  room: string;
}

export const CallingOverlay: React.FC<CallingOverlayProps> = ({ visible, patientName, room }) => {
  const presentation = getDestinationPresentation(room);
  const DestinationIcon = presentation.Icon;

  return (
    <div
      data-testid="calling-overlay"
      data-destination-kind={presentation.kind}
      className={`absolute inset-0 z-50 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className={cn('absolute inset-0 backdrop-blur-md', presentation.overlayClassName)} />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,246,248,0.96)_48%,rgba(234,243,255,0.94)_100%)]" />

      <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center sm:p-8">
        <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#BFEFE5] bg-[#E6F7F2] px-5 py-3 text-lg font-black text-[#007A65] shadow-[0_16px_40px_rgba(0,187,148,0.16)]">
          <BellRing className="h-6 w-6 animate-pulse" aria-hidden="true" />
          <span>Chamando</span>
        </div>

        <p className="max-w-7xl break-words text-[clamp(4rem,10vw,10rem)] font-black leading-[0.95] text-[#001B3D]">
          {patientName}
        </p>

        <div
          data-testid="calling-destination"
          data-destination-kind={presentation.kind}
          className={cn(
            DISPLAY_CLASS.destinationPill,
            'mt-9 flex-col gap-3 px-6 py-5 sm:flex-row sm:gap-5 sm:px-9 sm:py-6',
            presentation.accentBgClassName,
            presentation.borderClassName
          )}
        >
          <div className={cn(DISPLAY_CLASS.iconTile, presentation.accentTextClassName)}>
            <DestinationIcon className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className={cn('text-sm font-black uppercase md:text-base', presentation.accentTextClassName)}>
              {presentation.eyebrow}
            </p>
            <p className="break-words text-4xl font-black leading-tight text-[#001B3D] md:text-7xl">{room}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

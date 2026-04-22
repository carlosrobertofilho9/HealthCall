import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  IdCard,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import type { Appointment, Patient } from '@/types';
import { cn } from '@/lib/utils';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface NextPatientsFooterProps {
  nextPatients: Patient[];
  scheduledAppointmentsAwaitingCheckIn?: Appointment[];
}

type FooterPanel = 'queue' | 'scheduled' | 'clock' | 'sus' | 'wait';

const FOOTER_PANELS: FooterPanel[] = ['queue', 'scheduled', 'clock', 'sus', 'wait'];
const FOOTER_PANEL_INTERVAL_MS = 12000;
const CLOCK_REFRESH_INTERVAL_MS = 60000;

function formatClock(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const NextPatientsFooter: React.FC<NextPatientsFooterProps> = ({
  nextPatients,
  scheduledAppointmentsAwaitingCheckIn = [],
}) => {
  const upcoming = nextPatients.slice(0, 3);
  const scheduledUpcoming = scheduledAppointmentsAwaitingCheckIn.slice(0, 3);
  const [panelIndex, setPanelIndex] = useState(0);
  const [clock, setClock] = useState(formatClock());
  const activePanel = FOOTER_PANELS[panelIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setPanelIndex((previous) => (previous + 1) % FOOTER_PANELS.length);
    }, FOOTER_PANEL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(formatClock());
    }, CLOCK_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={cn('flex h-[clamp(8.75rem,24dvh,13rem)] min-h-0 shrink-0 flex-col overflow-hidden p-3 sm:p-4 lg:p-5', DISPLAY_CLASS.panel)}>
      <div
        key={activePanel}
        data-testid="display-footer-panel"
        data-footer-panel={activePanel}
        className="min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {activePanel === 'queue' && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 lg:mb-3">
              <div>
                <p className="text-xs font-black uppercase text-[#00BB94]">Fila de espera</p>
                <h3 className="text-xl font-black lg:text-2xl">Próximos pacientes</h3>
              </div>
              <div className={DISPLAY_CLASS.metricPill}>
                <UsersRound className="h-4 w-4 text-[#00BB94]" aria-hidden="true" />
                {upcoming.length} em destaque
              </div>
            </div>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                {upcoming.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex min-h-[4rem] items-center justify-between gap-3 p-3 lg:min-h-[4.75rem] lg:p-4',
                      DISPLAY_CLASS.panelItem,
                      DISPLAY_CLASS.panelItemInteractive
                    )}
                  >
                    <div className="min-w-0">
                      <p className="break-words font-black leading-tight">{p.name}</p>
                      <p className={cn('mt-1 break-words text-sm font-semibold leading-snug', DISPLAY_CLASS.textMuted)}>
                        {p.destination}
                      </p>
                    </div>
                    <ChevronRight className="h-6 w-6 shrink-0 text-[#00BB94]" aria-hidden="true" />
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={cn(
                  'rounded-[1.5rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-lg font-bold',
                  DISPLAY_CLASS.textMuted
                )}
              >
                Não há pacientes na fila de espera.
              </p>
            )}
          </>
        )}

        {activePanel === 'scheduled' && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 lg:mb-3">
              <div>
                <p className="text-xs font-black uppercase text-[#1466F5]">Agenda do dia</p>
                <h3 className="text-xl font-black lg:text-2xl">Pacientes agendados aguardando check-in</h3>
              </div>
              <div className={DISPLAY_CLASS.metricPill}>
                <CalendarCheck className="h-4 w-4 text-[#1466F5]" aria-hidden="true" />
                {scheduledUpcoming.length} pendentes
              </div>
            </div>
            {scheduledUpcoming.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                {scheduledUpcoming.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={cn(
                      'flex min-h-[4rem] items-center justify-between gap-3 p-3 lg:min-h-[4.75rem] lg:p-4',
                      DISPLAY_CLASS.panelItem,
                      DISPLAY_CLASS.panelItemInteractive
                    )}
                  >
                    <div className="min-w-0">
                      <p className="break-words font-black leading-tight">{appointment.patient_name}</p>
                      <p className={cn('mt-1 break-words text-sm font-semibold leading-snug', DISPLAY_CLASS.textMuted)}>
                        Agenda #{appointment.slot_number}
                      </p>
                    </div>
                    <CalendarCheck className="h-6 w-6 shrink-0 text-[#1466F5]" aria-hidden="true" />
                  </div>
                ))}
              </div>
            ) : (
              <p
                className={cn(
                  'rounded-[1.5rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-lg font-bold',
                  DISPLAY_CLASS.textMuted
                )}
              >
                Não há pacientes agendados aguardando check-in.
              </p>
            )}
          </>
        )}

        {activePanel === 'clock' && (
          <div className="flex h-full items-center justify-center gap-4 text-center lg:gap-5">
            <div className={DISPLAY_CLASS.iconTile}>
              <Clock className="h-7 w-7 text-[#00BB94]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-[#64748B] lg:text-xl">Horário atual</h3>
              <p className="mt-1 text-5xl font-black leading-none md:text-6xl xl:text-7xl">{clock}</p>
            </div>
          </div>
        )}

        {activePanel === 'sus' && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4 lg:gap-5">
            <div className={DISPLAY_CLASS.iconTile}>
              <IdCard className="h-7 w-7 text-[#1466F5]" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black leading-tight md:text-4xl xl:text-5xl">Mantenha seu cartão SUS em mãos</p>
          </div>
        )}

        {activePanel === 'wait' && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4 lg:gap-5">
            <div className={DISPLAY_CLASS.iconTile}>
              <UserRoundCheck className="h-7 w-7 text-[#00BB94]" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black leading-tight md:text-4xl xl:text-5xl">Aguarde ser chamado</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex shrink-0 justify-center gap-2 lg:mt-3">
        {FOOTER_PANELS.map((panel, index) => (
          <span
            key={panel}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === panelIndex ? 'w-8 bg-[#00BB94]' : 'w-2 bg-[#DCE5EE]'
            )}
          />
        ))}
      </div>
    </section>
  );
};

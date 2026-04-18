import React, { useEffect, useState } from 'react';
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
    <section className={cn('mt-8 p-6 min-h-[11rem] overflow-hidden', DISPLAY_CLASS.panel)}>
      <div
        key={activePanel}
        data-testid="display-footer-panel"
        data-footer-panel={activePanel}
        className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {activePanel === 'queue' && (
          <>
            <h3 className="text-xl font-bold mb-4">Próximos pacientes</h3>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((p) => (
                  <div key={p.id} className={cn('p-4 flex items-center justify-between gap-4 min-h-[5rem]', DISPLAY_CLASS.panelItem)}>
                    <div className="min-w-0">
                      <p className="font-semibold break-words leading-tight">{p.name}</p>
                      <p className={cn('text-sm break-words leading-snug mt-1', DISPLAY_CLASS.textSoft)}>{p.destination}</p>
                    </div>
                    <span className={cn('material-symbols-outlined shrink-0', DISPLAY_CLASS.iconPrimary)}>chevron_right</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={DISPLAY_CLASS.textSoft}>Não há pacientes na fila de espera.</p>
            )}
          </>
        )}

        {activePanel === 'scheduled' && (
          <>
            <h3 className="text-xl font-bold mb-4">Pacientes agendados aguardando check-in</h3>
            {scheduledUpcoming.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledUpcoming.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={cn('p-4 flex items-center justify-between gap-4 min-h-[5rem]', DISPLAY_CLASS.panelItem)}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold break-words leading-tight">{appointment.patient_name}</p>
                      <p className={cn('text-sm break-words leading-snug mt-1', DISPLAY_CLASS.textSoft)}>
                        Agenda #{appointment.slot_number}
                      </p>
                    </div>
                    <span className={cn('material-symbols-outlined shrink-0', DISPLAY_CLASS.iconPrimary)}>event_available</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={DISPLAY_CLASS.textSoft}>Não há pacientes agendados aguardando check-in.</p>
            )}
          </>
        )}

        {activePanel === 'clock' && (
          <div className="min-h-[8rem] flex items-center justify-center gap-5 text-center">
            <span className={cn('material-symbols-outlined text-6xl', DISPLAY_CLASS.iconPrimary)}>schedule</span>
            <div>
              <h3 className={cn('text-xl font-bold uppercase tracking-[0.18em]', DISPLAY_CLASS.textSoft)}>Horário atual</h3>
              <p className="text-6xl md:text-7xl font-black leading-none mt-2">{clock}</p>
            </div>
          </div>
        )}

        {activePanel === 'sus' && (
          <div className="min-h-[8rem] flex items-center justify-center gap-5 text-center">
            <span className={cn('material-symbols-outlined text-6xl', DISPLAY_CLASS.iconPrimary)}>id_card</span>
            <p className="text-4xl md:text-5xl font-black leading-tight">Mantenha seu cartão SUS em mãos</p>
          </div>
        )}

        {activePanel === 'wait' && (
          <div className="min-h-[8rem] flex items-center justify-center gap-5 text-center">
            <span className={cn('material-symbols-outlined text-6xl', DISPLAY_CLASS.iconPrimary)}>patient_list</span>
            <p className="text-4xl md:text-5xl font-black leading-tight">Aguarde ser chamado</p>
          </div>
        )}
      </div>
    </section>
  );
};

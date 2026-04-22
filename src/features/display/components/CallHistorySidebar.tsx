import React from 'react';
import { Clock, History, Megaphone, Radio } from 'lucide-react';
import { CallRecord, Patient } from '@/types';
import { cn } from '@/lib/utils';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface CallHistorySidebarProps {
  callHistory: CallRecord[];
  calledPatient: Patient | null;
}

/**
 * Sidebar com histórico das últimas 5 chamadas.
 * Destaca a chamada mais recente com status ativo.
 */
export const CallHistorySidebar: React.FC<CallHistorySidebarProps> = ({
  callHistory,
  calledPatient,
}) => {
  const recentCalls = callHistory.slice(0, 5);

  return (
    <aside className={cn('flex h-full min-h-0 flex-col overflow-hidden p-4 xl:p-5', DISPLAY_CLASS.panel)}>
      <div className="mb-3 flex shrink-0 items-start justify-between gap-4 xl:mb-4">
        <div>
          <p className="text-xs font-black uppercase text-[#00BB94]">Chamadas recentes</p>
          <h3 className="mt-1 text-xl font-black leading-tight xl:text-2xl">Histórico de Chamadas</h3>
        </div>
        <div className={DISPLAY_CLASS.metricPill}>
          <History className="h-4 w-4 text-[#00BB94]" aria-hidden="true" />
          {recentCalls.length}
        </div>
      </div>

      <div className="min-h-0 flex-grow space-y-2 overflow-hidden xl:space-y-3">
        {recentCalls.length === 0 && (
          <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center">
            <div className={DISPLAY_CLASS.iconTile}>
              <Radio className="h-6 w-6 text-[#00BB94]" aria-hidden="true" />
            </div>
            <p className="mt-4 text-lg font-black">Nenhuma chamada registrada.</p>
            <p className={`mt-2 max-w-56 text-sm font-medium ${DISPLAY_CLASS.textMuted}`}>
              As últimas chamadas aparecerão aqui para orientação rápida.
            </p>
          </div>
        )}

        {recentCalls.map((rec, idx) => (
          <div
            key={`${rec.id}-${rec.callCount}-${rec.calledAt}-${idx}`}
            className={cn(
              'p-3 transition-all duration-300 xl:p-4',
              DISPLAY_CLASS.panelItem,
              idx === 0 ? DISPLAY_CLASS.panelItemActive : DISPLAY_CLASS.panelItemInteractive,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={cn(DISPLAY_CLASS.iconTile, idx === 0 ? 'text-[#007A65]' : 'text-[#1466F5]')}>
                  {idx === 0 ? (
                    <Megaphone className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <History className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-black leading-tight xl:text-base">{rec.name}</p>
                  <p className={`mt-1 break-words text-xs font-semibold xl:text-sm ${DISPLAY_CLASS.textMuted}`}>{rec.destination}</p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-sm font-black text-[#001B3D]">
                  <Clock className="h-3.5 w-3.5 text-[#00BB94]" aria-hidden="true" />
                  {new Date(rec.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className={`mt-1 block text-xs font-bold ${DISPLAY_CLASS.textMuted}`}>{rec.callCount}ª chamada</span>
              </div>
            </div>

            {idx === 0 && calledPatient && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-black text-[#007A65]">
                <span className="h-2 w-2 rounded-full bg-[#00BB94] animate-pulse" />
                Chamado
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

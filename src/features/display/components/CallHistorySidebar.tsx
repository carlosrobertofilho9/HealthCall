import React from 'react';
import { CallRecord, Patient } from '@/types';
import { cn } from '@/lib/utils';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface CallHistorySidebarProps {
  callHistory: CallRecord[];
  calledPatient: Patient | null;
}

/**
 * Sidebar com histórico das últimas 5 chamadas.
 * Destaca a chamada mais recente com borda verde e status pulsante.
 */
export const CallHistorySidebar: React.FC<CallHistorySidebarProps> = ({
  callHistory,
  calledPatient,
}) => {
  const recentCalls = callHistory.slice(0, 5);

  return (
    <aside className={cn('p-6 flex flex-col', DISPLAY_CLASS.panel)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Histórico de Chamadas</h3>
      </div>
      <div className="space-y-3 pr-2 flex-grow">
        {recentCalls.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className={DISPLAY_CLASS.textMuted}>Nenhuma chamada registrada.</p>
          </div>
        )}
        {recentCalls.map((rec, idx) => (
          <div
            key={`${rec.id}-${rec.callCount}-${rec.calledAt}-${idx}`}
            className={cn(
              'p-4 transition-all duration-300',
              DISPLAY_CLASS.panelItem,
              idx === 0 ? DISPLAY_CLASS.panelItemActive : DISPLAY_CLASS.panelItemInteractive,
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-2xl ${DISPLAY_CLASS.iconPrimary}`}>
                  {idx === 0 ? 'campaign' : 'history'}
                </span>
                <div>
                  <p className="font-bold">{rec.name}</p>
                  <p className={`text-sm ${DISPLAY_CLASS.textSoft}`}>{rec.destination}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${DISPLAY_CLASS.iconPrimary}`}>
                  {new Date(rec.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className={`text-xs ${DISPLAY_CLASS.textMuted}`}>{rec.callCount}ª chamada</span>
              </div>
            </div>
            {idx === 0 && calledPatient && (
              <div className="mt-2 text-center">
                <p className={`text-sm font-semibold ${DISPLAY_CLASS.iconPrimary} animate-pulse`}>Chamado</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

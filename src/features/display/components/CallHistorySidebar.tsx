import React from 'react';
import { CallRecord, Patient } from '@/types';

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
    <aside className="bg-gray-800 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Histórico de Chamadas</h3>
      </div>
      <div className="space-y-3 pr-2 flex-grow">
        {recentCalls.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Nenhuma chamada registrada.</p>
          </div>
        )}
        {recentCalls.map((rec, idx) => (
          <div
            key={`${rec.id}-${rec.callCount}-${rec.calledAt}-${idx}`}
            className={`p-4 rounded-lg transition-all duration-300 ${
              idx === 0
                ? 'bg-green-800/50 border border-green-600 shadow-lg'
                : 'bg-gray-700/60 hover:bg-gray-700/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-green-400">
                  {idx === 0 ? 'campaign' : 'history'}
                </span>
                <div>
                  <p className="font-bold text-white">{rec.name}</p>
                  <p className="text-sm text-gray-300">{rec.destination}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-300">
                  {new Date(rec.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className="text-xs text-gray-400">{rec.callCount}ª chamada</span>
              </div>
            </div>
            {idx === 0 && calledPatient && (
              <div className="mt-2 text-center">
                <p className="text-sm font-semibold text-green-300 animate-pulse">Chamado</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

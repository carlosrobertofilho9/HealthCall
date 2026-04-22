import React, { useEffect, useState } from 'react';
import { Activity, CalendarCheck, Clock, History, Radio, UsersRound } from 'lucide-react';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface DisplayHeaderProps {
  queueCount: number;
  scheduledCount: number;
  historyCount: number;
}

function formatClock(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDate(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

/**
 * Header operacional do display com branding, status em tempo real e resumo compacto.
 */
export const DisplayHeader: React.FC<DisplayHeaderProps> = ({
  queueCount,
  scheduledCount,
  historyCount,
}) => {
  const [clock, setClock] = useState(formatClock());

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(formatClock());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const indicators = [
    { label: 'Fila', value: queueCount, Icon: UsersRound },
    { label: 'Agendados', value: scheduledCount, Icon: CalendarCheck },
    { label: 'Histórico', value: historyCount, Icon: History },
  ];

  return (
    <header className={DISPLAY_CLASS.header}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#DCE5EE] bg-white shadow-[0_12px_30px_rgba(0,27,61,0.07)]">
            <img src="/healthcall-icon.png" alt="HealthCall" className="h-8 w-8 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase text-[#00BB94]">HealthCall Display</p>
              <span className="hidden items-center gap-1 rounded-full bg-[#E6F7F2] px-2.5 py-1 text-xs font-bold text-[#007A65] sm:inline-flex">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Operação em tempo real
              </span>
            </div>
            <h1 className="truncate text-lg font-black leading-tight sm:text-xl xl:text-2xl">PSF Maria Lucia da Silva</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#E5ECF3] bg-[#F8FAFC] px-3 py-2 text-sm font-bold text-[#001B3D]">
            <Clock className="h-4 w-4 text-[#1466F5]" aria-hidden="true" />
            <span>{clock}</span>
            <span className="hidden text-[#64748B] sm:inline">{formatDate()}</span>
          </div>

          <div className="hidden flex-wrap items-center gap-2 md:flex">
            {indicators.map(({ label, value, Icon }) => (
              <div key={label} className={DISPLAY_CLASS.metricPill}>
                <Icon className="h-4 w-4 text-[#00BB94]" aria-hidden="true" />
                <span className="text-[#64748B]">{label}</span>
                <strong className="text-[#001B3D]">{value}</strong>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#BFEFE5] bg-[#E6F7F2] px-3 py-2 text-sm font-bold text-[#007A65]">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Online
          </div>
        </div>
      </div>
    </header>
  );
};

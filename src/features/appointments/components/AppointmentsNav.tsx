import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, CalendarDays, CalendarRange, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/appointments', label: 'Dia', icon: CalendarDays, end: true },
  { to: '/appointments/quick', label: 'Rápida', icon: Zap },
  { to: '/appointments/week', label: 'Semana', icon: CalendarRange },
  { to: '/appointments/capacity', label: 'Capacidade', icon: BarChart3 },
];

export const AppointmentsNav: React.FC = () => {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div>
        <h1 className="text-2xl font-bold text-white">Marcações</h1>
        <p className="text-sm text-[#96c5a9]">Agenda, visão semanal e capacidade de atendimento</p>
      </div>

      <nav className="grid grid-cols-4 rounded-2xl border border-[#264532] bg-[#1a3a26] p-1 sm:w-auto">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-primary text-[#122118]'
                  : 'text-[#96c5a9] hover:bg-[#264532] hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppointmentsNav;

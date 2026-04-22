import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/appointments', label: 'Dia', shortLabel: 'Dia', icon: CalendarDays },
  { to: '/appointments/week', label: 'Semana', shortLabel: 'Semana', icon: CalendarRange },
  { to: '/appointments/capacity', label: 'Capacidade', shortLabel: 'Cap.', icon: BarChart3 },
];

export const AppointmentsNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentTab = links.some((link) => link.to === pathname) ? pathname : '/appointments';

  return (
    <>
      <nav aria-label="Variações da agenda" className="hidden w-full md:block print:hidden">
        <div className="grid w-full grid-cols-3 gap-1 rounded-[1.05rem] border border-[#DCE5EE] bg-white/92 p-1 shadow-[0_10px_26px_rgba(0,27,61,0.06)] backdrop-blur lg:w-auto">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = currentTab === to;

            return (
              <button
                key={to}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(to)}
                className={cn(
                  'inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-[0.85rem] px-3 text-xs font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 active:scale-[0.98] sm:text-sm',
                  isActive
                    ? 'bg-[#001B3D] text-white shadow-[0_10px_22px_rgba(0,27,61,0.16)]'
                    : 'bg-transparent text-[#334155] hover:bg-[#EAF3FF] hover:text-[#001B3D]'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#7CE7D1]' : 'text-[#1466F5]')} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <nav
        aria-label="Acesso rápido da agenda"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCE5EE] bg-[#EFF8F6]/96 px-3 pt-2 shadow-[0_-18px_44px_rgba(0,27,61,0.12)] backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] md:hidden print:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {links.map(({ to, shortLabel, icon: Icon }) => {
            const isActive = currentTab === to;

            return (
              <button
                key={to}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(to)}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1rem] text-[11px] font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 active:scale-[0.97]',
                  isActive
                    ? 'bg-[#001B3D] text-white shadow-[0_10px_24px_rgba(0,27,61,0.18)]'
                    : 'border border-[#DCE5EE] bg-[#F8FAFC] text-[#334155]'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-[#7CE7D1]' : 'text-[#1466F5]')} />
                <span>{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default AppointmentsNav;

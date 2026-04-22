import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileStickyTabs } from '@/components/ui';

const links = [
  { to: '/appointments', label: 'Dia', icon: CalendarDays },
  { to: '/appointments/week', label: 'Semana', icon: CalendarRange },
  { to: '/appointments/capacity', label: 'Capacidade', icon: BarChart3 },
];

interface AppointmentsNavProps {
  showMobile?: boolean;
  showDesktop?: boolean;
}

export const AppointmentsNav: React.FC<AppointmentsNavProps> = ({
  showMobile = true,
  showDesktop = true,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentTab = links.some((link) => link.to === pathname) ? pathname : '/appointments';

  return (
    <>
      {showMobile && (
        <MobileStickyTabs
          value={currentTab}
          onValueChange={(value) => navigate(value)}
          ariaLabel="Navegação da agenda"
          className="md:hidden"
          items={links.map(({ to, label, icon: Icon }) => ({
            value: to,
            label,
            icon: <Icon className="h-4 w-4" />,
          }))}
        />
      )}

      {showDesktop && (
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
      )}
    </>
  );
};

export default AppointmentsNav;

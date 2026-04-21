import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, CalendarRange } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';

const links = [
  { to: '/appointments', label: 'Dia', icon: CalendarDays, end: true },
  { to: '/appointments/week', label: 'Semana', icon: CalendarRange },
  { to: '/appointments/capacity', label: 'Capacidade', icon: BarChart3 },
];

export const AppointmentsNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentTab = links.some((link) => link.to === pathname) ? pathname : '/appointments';

  return (
    <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-4 print:hidden">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-card-foreground">Marcações</h1>
        <p className="text-sm text-muted-foreground">Agenda, visão semanal e capacidade de atendimento</p>
      </div>

      <Tabs value={currentTab} onValueChange={navigate} className="w-full md:w-auto">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          {links.map(({ to, label, icon: Icon }) => (
            <TabsTrigger key={to} value={to} aria-label={label}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default AppointmentsNav;

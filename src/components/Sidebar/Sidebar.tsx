import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Bandage,
  BellRing,
  CalendarRange,
  ClipboardCheck,
  ConciergeBell,
  Files,
  Menu,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Settings2,
  SlidersHorizontal,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getStationSettings, type StationSettings } from '@/features/local/stationSettings';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((previous: boolean) => boolean)) => void;
}

interface SidebarItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

const sections: { label: string; items: SidebarItem[] }[] = [
  { label: 'Operação', items: [
    { to: '/', icon: Users, label: 'Fila', end: true },
    { to: '/appointments', icon: CalendarRange, label: 'Marcações' },
    { to: '/reception', icon: ConciergeBell, label: 'Recepção' },
  ]},
  { label: 'Atendimento', items: [
    { to: '/wounds', icon: Bandage, label: 'Curativos' },
    { to: '/prescriptions', icon: Pill, label: 'Receitas' },
    { to: '/pendencias', icon: ClipboardCheck, label: 'Pendências' },
  ]},
  { label: 'Comunicação', items: [
    { to: '/warnings', icon: BellRing, label: 'Avisos' },
    { to: '/display', icon: MonitorSmartphone, label: 'Display' },
  ]},
  { label: 'Sistema', items: [
    { to: '/documents', icon: Files, label: 'Documentos' },
    { to: '/settings', icon: SlidersHorizontal, label: 'Ajustes' },
    { to: '/station', icon: Settings2, label: 'Este posto' },
  ]},
];

function stationLabel(station: StationSettings) {
  const room = station.room ? `Sala ${station.room}` : 'Sala não definida';
  return `${station.role} · ${room}`;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [station, setStation] = useState<StationSettings>(() => getStationSettings());
  const { profile } = useUserProfile();
  const location = useLocation();
  const compact = isCollapsed && !mobileOpen;

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const refreshStation = () => setStation(getStationSettings());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('healthcall:station-settings', refreshStation);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('healthcall:station-settings', refreshStation);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const activeLabel = useMemo(() => {
    const items = sections.flatMap((section) => section.items);
    return items
      .filter((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))
      .sort((a, b) => b.to.length - a.to.length)[0]?.label || 'HealthCall';
  }, [location.pathname]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-3">
          <img src="/healthcall-logo-header.png" alt="HealthCall" className="size-9 object-contain" />
          <div>
            <strong className="block text-sm text-foreground">HealthCall</strong>
            <span className="text-xs text-muted-foreground">{activeLabel}</span>
          </div>
        </Link>
        <button className="rounded-xl border p-2" onClick={() => setMobileOpen((value) => !value)} aria-label="Alternar navegação">
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        'fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r bg-background shadow-lg transition-all',
        isCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-[19rem]',
        mobileOpen ? 'w-[19rem] translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="border-b p-3">
          <Link to="/" className={cn('flex items-center rounded-2xl p-2', compact ? 'justify-center' : 'gap-3')}>
            <img src="/healthcall-logo-header.png" alt="HealthCall" className="size-10 object-contain" />
            {!compact && (
              <div className="min-w-0">
                <div className="font-extrabold text-foreground">HealthCall</div>
                <div className="truncate text-xs text-muted-foreground">{profile?.department || 'Unidade de saúde'}</div>
              </div>
            )}
          </Link>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              {!compact && <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{section.label}</div>}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={compact ? item.label : undefined}
                    className={({ isActive }) => cn(
                      'flex h-11 items-center rounded-xl px-3 text-sm font-semibold transition-colors',
                      compact ? 'justify-center' : 'gap-3',
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    {!compact && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <Link to="/station" className={cn('flex items-center rounded-xl border bg-muted/40 p-2', compact ? 'justify-center' : 'gap-2')}>
            {online ? <Wifi className="size-4 text-emerald-600" /> : <WifiOff className="size-4 text-destructive" />}
            {!compact && (
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-foreground">{stationLabel(station)}</div>
                <div className="truncate text-[11px] text-muted-foreground">{station.name || (online ? 'Servidor local conectado' : 'Sem conexão')}</div>
              </div>
            )}
          </Link>

          <button
            type="button"
            className="mt-2 hidden h-10 w-full items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted lg:flex"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

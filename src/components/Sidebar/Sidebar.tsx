import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bandage,
  BellRing,
  Building2,
  CalendarRange,
  ChevronRight,
  ClipboardCheck,
  ConciergeBell,
  Files,
  LogOut,
  Menu,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((previous: boolean) => boolean)) => void;
}

interface SidebarItem {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  end?: boolean;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

const navigationSections: SidebarSection[] = [
  {
    label: 'Operação',
    items: [
      { to: '/', icon: Users, label: 'Fila', description: 'Fluxo do dia', end: true },
      { to: '/appointments', icon: CalendarRange, label: 'Marcações', description: 'Agenda APS' },
      { to: '/reception', icon: ConciergeBell, label: 'Recepção', description: 'Acolhimento' },
    ],
  },
  {
    label: 'Atendimento',
    items: [
      { to: '/wounds', icon: Bandage, label: 'Curativos', description: 'Evolução clínica' },
      { to: '/pendencias', icon: ClipboardCheck, label: 'Pendências', description: 'Demandas abertas' },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { to: '/warnings', icon: BellRing, label: 'Avisos', description: 'Comunicados' },
      { to: '/display', icon: MonitorSmartphone, label: 'Display', description: 'Chamada pública' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/documents', icon: Files, label: 'Documentos', description: 'Modelos e PDFs' },
      { to: '/settings', icon: SlidersHorizontal, label: 'Ajustes', description: 'Sistema' },
    ],
  },
];

const computeInitials = (text: string | null | undefined) => {
  const value = (text ?? '').trim();
  if (!value) return '?';

  if (value.includes(' ')) {
    const parts = value.split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts[parts.length - 1]?.[0] ?? '';
    return (first + last).toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const { profile } = useUserProfile();
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isCompact = isCollapsed && !isMobileMenuOpen;

  const userMeta = (user?.user_metadata ?? {}) as {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };

  const userName =
    profile?.full_name?.trim() ||
    userMeta.name ||
    userMeta.full_name ||
    user?.email?.split('@')[0] ||
    'Usuário';

  const avatarUrl = profile?.avatar_url || userMeta.avatar_url || null;
  const initials = computeInitials(userName);
  const unitLabel = profile?.department?.trim() || profile?.default_destination?.trim() || 'Unidade APS';
  const roleLabel = profile?.specialty?.trim() || 'Operação clínica';

  const activeModule = useMemo(() => {
    const flatItems = navigationSections.flatMap((section) => section.items);
    const activeItem = flatItems
      .filter((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
      .sort((left, right) => right.to.length - left.to.length)[0];

    return activeItem?.label ?? 'HealthCall';
  }, [location.pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      return;
    }
    navigate('/auth/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const renderCompactTooltip = (label: string, description?: string) => (
    <div className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-[80] min-w-44 -translate-y-1/2 translate-x-1 rounded-2xl border border-[#DCE5EE] bg-white px-3 py-2 text-left opacity-0 shadow-[0_20px_45px_rgba(0,27,61,0.14)] transition-all duration-200 group-hover/navitem:translate-x-0 group-hover/navitem:opacity-100 group-focus-visible/navitem:translate-x-0 group-focus-visible/navitem:opacity-100 group-hover/profile:translate-x-0 group-hover/profile:opacity-100">
      <span className="block text-sm font-extrabold leading-tight text-[#001B3D]">{label}</span>
      {description && <span className="mt-0.5 block text-xs font-semibold leading-tight text-[#64748B]">{description}</span>}
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#DCE5EE] bg-white/90 px-4 shadow-[0_12px_30px_rgba(0,27,61,0.06)] backdrop-blur-xl lg:hidden">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#DCE5EE] bg-[#F8FAFC] shadow-sm">
            <img src="/healthcall-logo-header.png" alt="HealthCall" className="size-7 object-contain" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-base font-extrabold leading-tight text-[#001B3D]">HealthCall</span>
            <span className="block truncate text-[11px] font-bold text-[#64748B]">{activeModule}</span>
          </div>
        </Link>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Fechar navegação' : 'Abrir navegação'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((previous) => !previous)}
          className="flex size-11 items-center justify-center rounded-2xl border border-[#DCE5EE] bg-[#F8FAFC] text-[#001B3D] shadow-sm transition-all duration-200 hover:border-[#BFD8FF] hover:bg-white hover:text-[#1466F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 active:scale-95"
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#001B3D]/28 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-[var(--app-visual-viewport-height,100dvh)] max-h-[var(--app-visual-viewport-height,100dvh)] flex-col overflow-visible border-r border-[#DCE5EE] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_54%,#F3F8F7_100%)] text-[#001B3D] shadow-[18px_0_55px_rgba(0,27,61,0.08)] transition-all duration-300 ease-out',
          isCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-[19rem]',
          isMobileMenuOpen ? 'w-[21rem] max-w-[calc(100vw-1.5rem)] translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1466F5_0%,#00BB94_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent_0%,#BFD8FF_26%,#CFEDE6_72%,transparent_100%)]" aria-hidden="true" />

        <div className={cn('shrink-0 px-3 pb-4 pt-5', isCompact ? 'px-3' : 'px-4')}>
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              'group/brand flex overflow-hidden rounded-[1.35rem] outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#00BB94]/45',
              isCompact
                ? 'h-14 items-center justify-center border border-[#DCE5EE] bg-white shadow-[0_12px_26px_rgba(0,27,61,0.06)]'
                : 'items-center gap-3 border border-[#DCE5EE] bg-white px-3 py-3.5 shadow-[0_16px_38px_rgba(0,27,61,0.07)] hover:border-[#CFEDE6]'
            )}
          >
            <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#DCE5EE] bg-[#F8FAFC]">
              <img
                src="/healthcall-logo-header.png"
                alt="HealthCall"
                className="size-8 object-contain transition-transform duration-300 group-hover/brand:scale-105"
              />
              <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#00BB94] shadow-[0_0_0_3px_rgba(0,187,148,0.16)]" />
            </div>

            {!isCompact && (
              <div className="min-w-0 animate-in fade-in slide-in-from-left-1 duration-200">
                <span className="block truncate text-lg font-extrabold leading-tight tracking-normal text-[#001B3D]">
                  HealthCall
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#007A65]">
                  <Activity className="size-3" />
                  OS clínico APS
                </span>
              </div>
            )}
          </Link>

          {!isCompact && (
            <div className="mt-3 rounded-[1.25rem] border border-[#CFEDE6] bg-[#E6F7F2]/75 px-3 py-2.5 text-[#007A65]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span className="truncate text-xs font-extrabold">Ambiente operacional seguro</span>
              </div>
            </div>
          )}
        </div>

        <nav
          aria-label="Navegação principal"
          className={cn(
            'custom-scrollbar min-h-0 flex-1 pb-3',
            isCompact ? 'overflow-visible px-3' : 'overflow-y-auto overflow-x-hidden px-4'
          )}
        >
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label} className={cn(sectionIndex === 0 ? 'mt-0' : isCompact ? 'mt-3' : 'mt-5')}>
              {isCompact ? (
                sectionIndex > 0 && <div className="mx-auto mb-3 h-px w-8 bg-[#DCE5EE]" aria-hidden="true" />
              ) : (
                <div className="mb-2 flex items-center gap-2 px-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B]">{section.label}</span>
                  <span className="h-px flex-1 bg-[linear-gradient(90deg,#DCE5EE_0%,transparent_100%)]" />
                </div>
              )}

              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group/navitem relative flex min-w-0 items-center rounded-[1.1rem] border outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 active:scale-[0.99]',
                        isCompact ? 'h-12 justify-center px-0' : 'h-[3.35rem] gap-3 px-3',
                        isActive
                          ? 'border-[#BFE8DF] bg-white text-[#001B3D] shadow-[0_12px_28px_rgba(0,187,148,0.12)]'
                          : 'border-transparent text-[#4A5D73] hover:border-[#DCE5EE] hover:bg-white/80 hover:text-[#001B3D] hover:shadow-[0_10px_24px_rgba(0,27,61,0.06)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200',
                            isActive ? 'bg-[#00BB94] opacity-100' : 'bg-transparent opacity-0'
                          )}
                        />

                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                            isActive
                              ? 'border-[#CFEDE6] bg-[#E6F7F2] text-[#007A65]'
                              : 'border-transparent bg-transparent text-[#64748B] group-hover/navitem:border-[#D5E6FF] group-hover/navitem:bg-[#EAF3FF] group-hover/navitem:text-[#1466F5]'
                          )}
                        >
                          <item.icon className="size-[18px]" strokeWidth={2.2} />
                        </span>

                        {!isCompact && (
                          <span className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-1 duration-200">
                            <span className="block truncate text-sm font-extrabold leading-tight">{item.label}</span>
                            <span
                              className={cn(
                                'mt-0.5 block truncate text-[11px] font-semibold leading-tight',
                                isActive ? 'text-[#007A65]' : 'text-[#64748B]'
                              )}
                            >
                              {item.description}
                            </span>
                          </span>
                        )}

                        {!isCompact && (
                          <ChevronRight
                            className={cn(
                              'size-4 shrink-0 transition-all duration-200',
                              isActive ? 'translate-x-0 text-[#00A885] opacity-100' : '-translate-x-1 text-[#94A3B8] opacity-0 group-hover/navitem:translate-x-0 group-hover/navitem:opacity-100'
                            )}
                          />
                        )}

                        {isCompact && renderCompactTooltip(item.label, item.description)}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn('shrink-0 px-3 pb-4 pt-2', isCompact ? 'px-3' : 'px-4')}>
          {!isCompact && (
            <div className="mb-3 rounded-[1.25rem] border border-[#D5E6FF] bg-[#EAF3FF]/70 p-3 text-[#0F5AD8]">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-xs font-extrabold">{unitLabel}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
                {isOnline ? <Wifi className="size-3.5 text-[#00A885]" /> : <WifiOff className="size-3.5 text-[#D9474F]" />}
                <span>{isOnline ? 'Conectado e sincronizado' : 'Modo offline'}</span>
              </div>
            </div>
          )}

          <div
            className={cn(
              'group/profile relative flex items-center rounded-[1.25rem] border border-[#DCE5EE] bg-white shadow-[0_14px_34px_rgba(0,27,61,0.07)] transition-all duration-200',
              isCompact ? 'justify-center p-2' : 'gap-3 p-2.5'
            )}
          >
            {avatarUrl ? (
              <div
                className="size-10 shrink-0 rounded-2xl border border-[#DCE5EE] bg-[#F8FAFC] bg-cover bg-center"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#CFEDE6] bg-[#E6F7F2] text-xs font-black text-[#007A65]">
                {initials}
              </div>
            )}

            {!isCompact && (
              <div className="min-w-0 flex-1 animate-in fade-in duration-200">
                <span className="block truncate text-sm font-extrabold leading-tight text-[#001B3D]">{userName}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-[#64748B]">{roleLabel}</span>
              </div>
            )}

            {isCompact && renderCompactTooltip(userName, roleLabel)}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'group/navitem relative mt-2.5 flex w-full items-center rounded-[1.1rem] border border-transparent text-[#B4232D] outline-none transition-all duration-200 hover:border-[#F3D6D8] hover:bg-[#FFF7F7] focus-visible:ring-2 focus-visible:ring-[#D9474F]/35 active:scale-[0.99]',
              isCompact ? 'h-11 justify-center px-0' : 'h-11 gap-3 px-3'
            )}
          >
            <LogOut className="size-5 shrink-0 transition-transform duration-200 group-hover/navitem:translate-x-0.5" />
            {!isCompact && <span className="truncate text-sm font-extrabold">Sair do sistema</span>}
            {isCompact && renderCompactTooltip('Sair do sistema', 'Encerrar sessão')}
          </button>
        </div>

        <button
          type="button"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          onClick={() => setIsCollapsed((previous) => !previous)}
          className="absolute -right-3 top-6 z-[70] hidden size-8 items-center justify-center rounded-full border border-[#DCE5EE] bg-white text-[#001B3D] shadow-[0_12px_28px_rgba(0,27,61,0.12)] transition-all duration-200 hover:border-[#CFEDE6] hover:text-[#00A885] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 active:scale-95 lg:flex"
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          <span className="sr-only">{isCollapsed ? 'Expandir' : 'Recolher'}</span>
        </button>

        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Fechar navegação' : 'Abrir navegação'}
          onClick={() => setIsMobileMenuOpen((previous) => !previous)}
          className="absolute right-3 top-5 z-[70] flex size-10 items-center justify-center rounded-2xl border border-[#DCE5EE] bg-white text-[#001B3D] shadow-sm transition-all duration-200 hover:text-[#1466F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BB94]/45 active:scale-95 lg:hidden"
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;

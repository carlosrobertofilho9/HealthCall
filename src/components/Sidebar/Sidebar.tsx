import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BellRing,
  Bandage,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ConciergeBell,
  Files,
  LogOut,
  Menu,
  MessageSquareDot,
  MonitorSmartphone,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile } = useUserProfile();
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isCompact = isCollapsed && !isMobileMenuOpen;

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      return;
    }
    navigate('/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  const navItems = [
    { to: '/', icon: Users, label: 'Fila', end: true },
    { to: '/appointments', icon: CalendarRange, label: 'Marcações' },
    { to: '/documents', icon: Files, label: 'Documentos' },
    { to: '/reception', icon: ConciergeBell, label: 'Recepção' },
    { to: '/wounds', icon: Bandage, label: 'Curativos' },
    { to: '/pendencias', icon: ClipboardCheck, label: 'Pendências' },
    { to: '/warnings', icon: BellRing, label: 'Avisos' },
    { to: '/display', icon: MonitorSmartphone, label: 'Display' },
    { to: '/settings', icon: SlidersHorizontal, label: 'Ajustes' },
  ];

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
            <img src="/healthcall-logo-header.png" alt="Logo" className="size-5 object-contain" />
          </div>
          <span className="text-base font-semibold tracking-tight">HealthCall</span>
        </Link>
        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground transition-colors hover:bg-accent"
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/75 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-20' : 'lg:w-70',
          isMobileMenuOpen ? 'w-70 translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex h-20 shrink-0 items-center border-b border-border/50', isCompact ? 'px-3' : 'px-5')}>
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn('group flex w-full items-center overflow-hidden rounded-xl', isCompact ? 'justify-center p-2.5' : 'gap-3 p-2.5')}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <img
                src="/healthcall-logo-header.png"
                alt="Logo"
                className="size-6 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {!isCompact && (
              <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="block truncate text-lg font-bold tracking-tight text-foreground">HealthCall</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Sistema</span>
              </div>
            )}
          </Link>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1.5 overflow-visible px-3 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-11 items-center rounded-xl transition-all duration-200',
                  isCompact ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-5 shrink-0 transition-transform duration-200 group-hover:scale-105', isActive && 'scale-105')} />

                  {!isCompact && (
                    <span className="truncate text-[14px] font-medium animate-in fade-in slide-in-from-left-2 duration-200">
                      {item.label}
                    </span>
                  )}

                  {isCompact && (
                    <div className="pointer-events-none absolute left-14 z-50 -translate-x-1 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                      {item.label}
                    </div>
                  )}

                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground transition-opacity duration-200',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-border/50 bg-muted/20 p-3">
          <div
            className={cn(
              'flex items-center rounded-xl border border-border/60 bg-card/70 transition-all duration-200',
              isCompact ? 'justify-center p-2' : 'gap-3 p-2.5'
            )}
          >
            {avatarUrl ? (
              <div
                className="size-9 shrink-0 rounded-lg border border-border bg-cover bg-center"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-semibold text-foreground">
                {initials}
              </div>
            )}

            {!isCompact && (
              <div className="min-w-0 flex-1 animate-in fade-in duration-200">
                <span className="block truncate text-sm font-semibold text-foreground">{userName}</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Online</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'group relative mt-2.5 flex h-11 w-full items-center rounded-xl text-destructive transition-colors duration-200 hover:bg-destructive/10',
              isCompact ? 'justify-center px-0' : 'gap-3 px-3'
            )}
          >
            <LogOut className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            {!isCompact && <span className="text-sm font-medium">Sair do sistema</span>}

            {isCompact && (
              <div className="pointer-events-none absolute left-14 z-50 -translate-x-1 whitespace-nowrap rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                Sair
              </div>
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="absolute right-2 top-6 z-50 hidden size-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-transform duration-200 hover:scale-105 hover:bg-accent active:scale-95 lg:flex"
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;

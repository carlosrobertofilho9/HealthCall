import React, { useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from '@/features/settings/services/settingsService';
import { UserProfile } from '@/actions/user';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileContext } from '../hooks/useUserProfile';
import { supabase } from '@/lib/supabaseClient';

/**
 * Um provedor de contexto que gerencia o perfil do usuário autenticado.
 *
 * Este componente busca o perfil do usuário, fornece uma função para atualizá-lo
 * (especificamente o destino padrão), e escuta por atualizações em tempo real
 * na tabela `profiles` do Supabase. O estado do perfil e as ações são
 * disponibilizados para os componentes filhos através do `UserProfileContext`.
 *
 * @param {object} props As propriedades do componente.
 * @param {React.ReactNode} props.children Os componentes filhos que terão acesso ao contexto.
 * @returns {React.ReactElement} O componente provedor.
 */
export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const p = await getUserProfile(user.id);
    setProfile(p);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const setDefaultDestination = useCallback(async (dest: string | null) => {
    if (!user) return;
    const updated = await updateUserProfile(user.id, { default_destination: dest ?? null });
    if (updated) setProfile(updated);
  }, [user]);

  return (
    <UserProfileContext.Provider value={{ profile, loading, refresh, setDefaultDestination, setProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

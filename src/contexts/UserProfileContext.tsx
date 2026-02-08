import React, { useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from '@/features/settings/services/settingsService';
import { UserProfile } from '@/types';
import { UserProfileContext } from '../hooks/useUserProfile';
import * as localDb from '@/services/localDatabase';

/**
 * Um provedor de contexto que gerencia o perfil do usuário.
 *
 * Este componente busca o perfil do usuário do banco de dados local, fornece uma função para atualizá-lo
 * (especificamente o destino padrão), e escuta por atualizações em tempo real.
 * O estado do perfil e as ações são disponibilizados para os componentes filhos através do `UserProfileContext`.
 *
 * @param {object} props As propriedades do componente.
 * @param {React.ReactNode} props.children Os componentes filhos que terão acesso ao contexto.
 * @returns {React.ReactElement} O componente provedor.
 */
export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const p = await getUserProfile();
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleDataUpdate = (data: { table: string }) => {
      if (data.table === 'settings') {
        refresh();
      }
    };

    localDb.onDataUpdate(handleDataUpdate);

    return () => {
      localDb.offDataUpdate(handleDataUpdate);
    };
  }, [refresh]);

  const setDefaultDestination = useCallback(async (dest: string | null) => {
    const updated = await updateUserProfile({ default_destination: dest ?? null });
    if (updated) setProfile(updated);
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, loading, refresh, setDefaultDestination, setProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from '@/features/settings/services/settingsService';
import { UserProfile } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type Ctx = {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setDefaultDestination: (dest: string | null) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
};

const UserProfileContext = createContext<Ctx | undefined>(undefined);

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

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile deve ser usado dentro de UserProfileProvider');
  return ctx;
}

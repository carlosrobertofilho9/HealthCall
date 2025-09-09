import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/actions/user';

type Ctx = {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setDefaultDestination: (dest: string | null) => Promise<void>;
};

const UserProfileContext = createContext<Ctx | undefined>(undefined);

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
    // Carregar no mount
    refresh();
  }, [refresh]);

  const setDefaultDestination = useCallback(async (dest: string | null) => {
    const updated = await updateUserProfile({ default_destination: dest ?? null });
    if (updated) setProfile(updated);
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, loading, refresh, setDefaultDestination }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile deve ser usado dentro de UserProfileProvider');
  return ctx;
}

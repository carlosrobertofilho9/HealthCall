import React, { useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from '@/features/settings/services/settingsService';
import { UserProfile } from '@/actions/user';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileContext } from '../hooks/useUserProfile';

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

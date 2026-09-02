import React, { useEffect, useState, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from '@/features/settings/services/settingsService';
import type { UserProfile } from '@/actions/user';
import { UserProfileContext } from '../hooks/useUserProfile';
import { subscribeHealthCallEvents } from '@/lib/apiClient';

const LOCAL_PROFILE_ID = 'local-profile';

/** Shared unit profile stored in the HealthCall local database. */
export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProfile(await getUserProfile(LOCAL_PROFILE_ID));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeHealthCallEvents((event) => {
      if (event.type === 'profile-changed') {
        if (event.profile) setProfile(event.profile as UserProfile);
        else void refresh();
      }
    });
  }, [refresh]);

  const setDefaultDestination = useCallback(async (dest: string | null) => {
    const updated = await updateUserProfile(LOCAL_PROFILE_ID, { default_destination: dest ?? null });
    if (updated) setProfile(updated);
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, loading, refresh, setDefaultDestination, setProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

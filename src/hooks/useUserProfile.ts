import { createContext, useContext } from 'react';
import { UserProfile } from '@/actions/user';

export type UserProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setDefaultDestination: (dest: string | null) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
};

export const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile deve ser usado dentro de UserProfileProvider');
  return ctx;
}

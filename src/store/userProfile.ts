import { create } from 'zustand';
import { getUserProfile, updateUserProfile } from '@/actions/user';
import type { UserProfile } from '@/types/user';

interface UserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  setDefaultDestination: (destination: string | null) => Promise<void>;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  loading: true,
  fetchProfile: async () => {
    set({ loading: true });
    const profile = await getUserProfile();
    set({ profile, loading: false });
  },
  setDefaultDestination: async (destination) => {
    const currentProfile = useUserProfileStore.getState().profile;
    if (currentProfile) {
      const updatedProfile = await updateUserProfile({ ...currentProfile, default_destination: destination });
      if (updatedProfile) {
        set({ profile: updatedProfile });
      }
    }
  },
}));

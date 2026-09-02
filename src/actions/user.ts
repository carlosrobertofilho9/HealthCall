import type { SettingsUserProfile } from '@/features/settings/types';
import {
  getUniqueDestinations as getDestinations,
  getUserProfile as loadProfile,
  updateUserProfile as saveProfile,
} from '@/features/settings/services/settingsService';

export type UserProfile = SettingsUserProfile;
const LOCAL_PROFILE_ID = 'local-profile';

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    return await loadProfile(LOCAL_PROFILE_ID);
  } catch (error) {
    console.error('Erro ao carregar perfil local:', error);
    return null;
  }
}

export async function updateUserProfile(update: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { id: _id, updated_at: _updatedAt, ...payload } = update;
    return await saveProfile(LOCAL_PROFILE_ID, payload);
  } catch (error) {
    console.error('Erro ao atualizar perfil local:', error);
    return null;
  }
}

export async function getUniqueDestinations(): Promise<string[]> {
  try {
    return await getDestinations();
  } catch (error) {
    console.error('Erro ao carregar destinos locais:', error);
    return [];
  }
}

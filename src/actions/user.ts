/**
 * @deprecated Este arquivo foi substituído por src/services/localDatabase.ts e src/types/index.ts
 * Mantido para compatibilidade retroativa.
 */

import * as localDb from '@/services/localDatabase';
import { getUserProfile as getProfile, updateUserProfile as updateProfile } from '@/features/settings/services/settingsService';

// Re-exporta o tipo de @/types para compatibilidade
export type { UserProfile } from '@/types';
import type { UserProfile } from '@/types';

/**
 * @deprecated Use settingsService.getUserProfile() diretamente
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  return getProfile();
}

/**
 * @deprecated Use settingsService.updateUserProfile() diretamente
 */
export async function updateUserProfile(update: Partial<UserProfile>): Promise<UserProfile | null> {
  return updateProfile(update);
}

/**
 * @deprecated Use localDb.getUniqueDestinations() diretamente
 */
export async function getUniqueDestinations(): Promise<string[]> {
  return localDb.getUniqueDestinations();
}

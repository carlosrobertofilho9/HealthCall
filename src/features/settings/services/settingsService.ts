import type { SettingsUserProfile, UpdateSettingsUserProfileInput } from '@/features/settings/types';
import { apiRequest, uploadLocalMedia } from '@/lib/apiClient';

export async function getUniqueDestinations(): Promise<string[]> {
  return apiRequest<string[]>('/api/destinations');
}

export async function updateUserProfile(
  _userId: string,
  profile: UpdateSettingsUserProfileInput,
): Promise<SettingsUserProfile | null> {
  return apiRequest<SettingsUserProfile>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
}

export async function getUserProfile(_userId: string): Promise<SettingsUserProfile | null> {
  return apiRequest<SettingsUserProfile>('/api/profile');
}

export async function uploadAvatar(_userId: string, file: File): Promise<string> {
  const uploaded = await uploadLocalMedia('avatars', file, file.name);
  return uploaded.url;
}

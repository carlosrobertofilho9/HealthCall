export interface SettingsUserProfile {
  id: string;
  updated_at: string | null;
  default_destination: string | null;
  full_name: string | null;
  specialty: string | null;
  department: string | null;
  avatar_url: string | null;
}

export type UpdateSettingsUserProfileInput = Partial<
  Omit<SettingsUserProfile, 'id' | 'updated_at'>
>;

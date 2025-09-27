import { supabase } from '@/lib/supabaseClient';

export type UserProfile = {
  id: string;
  updated_at: string | null;
  default_destination: string | null;
};

/**
 * Fetches the profile for the currently authenticated user.
 * @returns {Promise<UserProfile | null>} A promise that resolves to the user's profile, or null if not found or an error occurs.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, updated_at, default_destination')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return (data as UserProfile) ?? { id: user.id, updated_at: null, default_destination: null };
}

/**
 * Updates the profile for the currently authenticated user.
 * @param {Partial<UserProfile>} update - An object containing the profile fields to update.
 * @returns {Promise<UserProfile | null>} A promise that resolves to the updated user profile, or null if an error occurs.
 */
export async function updateUserProfile(update: Partial<UserProfile>): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const payload = { ...update, id: user.id, updated_at: new Date().toISOString() } as Partial<UserProfile> & {
    id: string;
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, updated_at, default_destination')
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  return data as UserProfile;
}

/**
 * Fetches a list of unique destination strings from the patients table.
 * @returns {Promise<string[]>} A promise that resolves to an array of unique destination strings.
 */
export async function getUniqueDestinations(): Promise<string[]> {
  // Fetch unique destinations from the patients table to populate a select input
  const { data, error } = await supabase
    .from('patients')
    .select('destination')
    .neq('destination', '')
    .order('destination', { ascending: true });

  if (error) {
    console.error('Error fetching unique destinations:', error);
    return [];
  }

  const set = new Set<string>();
  (data ?? []).forEach((row: any) => {
    if (row.destination) set.add(row.destination as string);
  });
  return Array.from(set);
}

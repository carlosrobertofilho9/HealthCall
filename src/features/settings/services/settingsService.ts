import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export async function getUniqueDestinations(): Promise<string[]> {
    const { data, error } = await supabase
        .from('patients')
        .select('destination');
    if (error) throw error;
    const destinations = data.map((d: { destination: string }) => d.destination);
    return [...new Set(destinations)];
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types';

/**
 * Busca todos os destinos únicos da tabela de pacientes.
 * @returns {Promise<string[]>} Uma promessa que resolve para um array de strings de destino únicas.
 * @throws {Error} Se a busca falhar.
 */
export async function getUniqueDestinations(): Promise<string[]> {
    const { data, error } = await supabase
        .from('patients')
        .select('destination');
    if (error) throw error;
    const destinations = data.map((d: { destination: string }) => d.destination);
    return [...new Set(destinations)];
}

/**
 * Atualiza o perfil de um usuário.
 * @param {string} userId - O ID do usuário a ser atualizado.
 * @param {Partial<UserProfile>} profile - Um objeto contendo os campos do perfil a serem atualizados.
 * @returns {Promise<UserProfile | null>} Uma promessa que resolve para o perfil do usuário atualizado.
 * @throws {Error} Se a atualização falhar.
 */
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

/**
 * Busca o perfil de um usuário pelo seu ID.
 * @param {string} userId - O ID do usuário a ser buscado.
 * @returns {Promise<UserProfile | null>} Uma promessa que resolve para o perfil do usuário.
 * @throws {Error} Se a busca falhar.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

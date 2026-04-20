import { supabase } from '@/lib/supabaseClient';
import type { SettingsUserProfile, UpdateSettingsUserProfileInput } from '@/features/settings/types';

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
export async function updateUserProfile(
    userId: string,
    profile: UpdateSettingsUserProfileInput,
): Promise<SettingsUserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...profile, updated_at: new Date().toISOString() })
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
export async function getUserProfile(userId: string): Promise<SettingsUserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

/**
 * Faz upload do avatar do usuário para o bucket `avatars`.
 *
 * @param {string} userId - ID do usuário autenticado.
 * @param {File} file - Arquivo de imagem a ser enviado.
 * @returns {Promise<string>} URL pública do arquivo após upload.
 * @throws {Error} Quando o upload falha.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
}

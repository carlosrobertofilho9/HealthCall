import * as localDb from '@/services/localDatabase';
import { UserProfile } from '@/types';

/**
 * Busca todos os destinos únicos da tabela de pacientes.
 * @returns {Promise<string[]>} Uma promessa que resolve para um array de strings de destino únicas.
 * @throws {Error} Se a busca falhar.
 */
export async function getUniqueDestinations(): Promise<string[]> {
    return localDb.getUniqueDestinations();
}

/**
 * Atualiza o perfil do usuário.
 * No modo local, salvamos as configurações no banco SQLite.
 * @param {Partial<UserProfile>} profile - Um objeto contendo os campos do perfil a serem atualizados.
 * @returns {Promise<UserProfile | null>} Uma promessa que resolve para o perfil do usuário atualizado.
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    // Salva as configurações do perfil no settings local
    if (profile.clinic_name !== undefined) {
        await localDb.setSetting('clinic_name', profile.clinic_name);
    }
    if (profile.default_message !== undefined) {
        await localDb.setSetting('default_message', profile.default_message);
    }
    if (profile.default_destination !== undefined) {
        await localDb.setSetting('default_destination', profile.default_destination);
    }
    // Retorna o perfil atualizado
    return getUserProfile();
}

/**
 * Busca o perfil do usuário.
 * No modo local, retorna um perfil baseado nas configurações locais.
 * @returns {Promise<UserProfile | null>} Uma promessa que resolve para o perfil do usuário.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    const clinicName = await localDb.getSetting('clinic_name');
    const defaultMessage = await localDb.getSetting('default_message');
    const defaultDestination = await localDb.getSetting('default_destination');
    
    return {
        id: 'local-user',
        clinic_name: clinicName || 'HealthCall',
        default_message: defaultMessage || null,
        default_destination: defaultDestination || null,
    } as UserProfile;
}

import { getDatabase } from '../db.js';

/**
 * Repositório para operações com configurações
 */

/**
 * Obtém uma configuração pelo key
 */
export function getSetting(key) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : null;
}

/**
 * Obtém todas as configurações
 */
export function getAllSettings() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM settings');
    const results = stmt.all();
    
    // Retorna como objeto key-value
    return results.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
}

/**
 * Define uma configuração (cria ou atualiza)
 */
export function setSetting(key, value, description = null) {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO settings (key, value, description, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET 
            value = excluded.value,
            description = COALESCE(excluded.description, settings.description),
            updated_at = datetime('now')
    `);
    stmt.run(key, value, description);
    return getSetting(key);
}

/**
 * Remove uma configuração
 */
export function deleteSetting(key) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM settings WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
}

/**
 * Define múltiplas configurações de uma vez
 */
export function setMultipleSettings(settingsObj) {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET 
            value = excluded.value,
            updated_at = datetime('now')
    `);
    
    const transaction = db.transaction((settings) => {
        for (const [key, value] of Object.entries(settings)) {
            stmt.run(key, String(value));
        }
    });
    
    transaction(settingsObj);
    return getAllSettings();
}

// Configurações específicas do app com getters/setters convenientes

/**
 * Obtém a URL do feed RSS
 */
export function getRssUrl() {
    return getSetting('rss_url') || 'https://g1.globo.com/dynamo/saude/rss2.xml';
}

/**
 * Define a URL do feed RSS
 */
export function setRssUrl(url) {
    return setSetting('rss_url', url, 'URL do Feed RSS de Notícias');
}

/**
 * Obtém o nome da clínica
 */
export function getClinicName() {
    return getSetting('clinic_name') || 'HealthCall';
}

/**
 * Define o nome da clínica
 */
export function setClinicName(name) {
    return setSetting('clinic_name', name, 'Nome da clínica');
}

/**
 * Obtém o volume do TTS
 */
export function getTtsVolume() {
    const value = getSetting('tts_volume');
    return value ? parseFloat(value) : 1.0;
}

/**
 * Define o volume do TTS
 */
export function setTtsVolume(volume) {
    return setSetting('tts_volume', String(volume), 'Volume do TTS (0.0 a 1.0)');
}

/**
 * Obtém se o TTS está habilitado
 */
export function isTtsEnabled() {
    const value = getSetting('tts_enabled');
    return value === null || value === 'true';
}

/**
 * Define se o TTS está habilitado
 */
export function setTtsEnabled(enabled) {
    return setSetting('tts_enabled', String(enabled), 'TTS habilitado');
}

export default {
    getSetting,
    getAllSettings,
    setSetting,
    deleteSetting,
    setMultipleSettings,
    getRssUrl,
    setRssUrl,
    getClinicName,
    setClinicName,
    getTtsVolume,
    setTtsVolume,
    isTtsEnabled,
    setTtsEnabled
};

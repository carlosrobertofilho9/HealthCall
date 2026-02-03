import { getDatabase, generateUUID, getUploadsPath } from '../db.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * Repositório para operações com avisos (warnings)
 */

/**
 * Lista todos os avisos ordenados por prioridade e ordem
 */
export function listWarnings() {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM warnings 
        ORDER BY priority DESC, "order" ASC, created_at DESC
    `);
    return stmt.all().map(normalizeWarning);
}

/**
 * Lista apenas avisos ativos
 */
export function listActiveWarnings() {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM warnings 
        WHERE active = 1
        ORDER BY priority DESC, "order" ASC, created_at DESC
    `);
    return stmt.all().map(normalizeWarning);
}

/**
 * Busca um aviso pelo ID
 */
export function getWarningById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM warnings WHERE id = ?');
    const result = stmt.get(id);
    return result ? normalizeWarning(result) : null;
}

/**
 * Adiciona um novo aviso
 */
export function addWarning({
    text,
    background_url = null,
    active = true,
    media_type = 'image',
    qrcode_url = null,
    start_time = null,
    end_time = null,
    duration = null,
    priority = false,
    order = null,
    id = null,
    audio_url = null
}) {
    const db = getDatabase();
    const finalId = id || generateUUID();
    
    // Se order não foi fornecido, define como próximo na sequência
    if (order === null) {
        const maxOrderStmt = db.prepare('SELECT MAX("order") as maxOrder FROM warnings');
        const result = maxOrderStmt.get();
        order = (result?.maxOrder || 0) + 1;
    }
    
    const stmt = db.prepare(`
        INSERT INTO warnings (id, text, background_url, active, media_type, qrcode_url, start_time, end_time, duration, priority, "order", created_at, audio_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `);
    stmt.run(
        finalId, 
        text, 
        background_url, 
        active ? 1 : 0, 
        media_type, 
        qrcode_url, 
        start_time, 
        end_time, 
        duration, 
        priority ? 1 : 0, 
        order,
        audio_url
    );
    
    return getWarningById(finalId);
}

/**
 * Atualiza um aviso existente
 */
export function updateWarning(id, updates) {
    const db = getDatabase();
    const current = getWarningById(id);
    if (!current) return null;

    const merged = { ...current, ...updates };
    
    const stmt = db.prepare(`
        UPDATE warnings 
        SET text = ?, background_url = ?, active = ?, media_type = ?, 
            qrcode_url = ?, start_time = ?, end_time = ?, duration = ?, 
            priority = ?, "order" = ?, audio_url = ?
        WHERE id = ?
    `);
    stmt.run(
        merged.text,
        merged.background_url,
        merged.active ? 1 : 0,
        merged.media_type,
        merged.qrcode_url,
        merged.start_time,
        merged.end_time,
        merged.duration,
        merged.priority ? 1 : 0,
        merged.order,
        merged.audio_url || null,
        id
    );
    
    return getWarningById(id);
}

/**
 * Remove um aviso e seu arquivo de mídia associado
 */
export function removeWarning(id) {
    const db = getDatabase();
    
    // Primeiro busca o aviso para pegar o background_url
    const warning = getWarningById(id);
    
    // Remove o arquivo de mídia se existir e for local
    if (warning?.background_url) {
        try {
            const uploadsPath = getUploadsPath();
            const filename = path.basename(warning.background_url);
            const filePath = path.join(uploadsPath, filename);
            if (fs.existsSync(filePath)) {
                fs.removeSync(filePath);
                console.log('[Warnings] Removed media file:', filePath);
            }
        } catch (error) {
            console.error('[Warnings] Error removing media file:', error);
        }
    }
    
    const stmt = db.prepare('DELETE FROM warnings WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Alterna o estado ativo de um aviso
 */
export function toggleWarningActive(id) {
    const db = getDatabase();
    const warning = getWarningById(id);
    if (!warning) return null;
    
    const newActive = !warning.active;
    const stmt = db.prepare('UPDATE warnings SET active = ? WHERE id = ?');
    stmt.run(newActive ? 1 : 0, id);
    
    return getWarningById(id);
}

/**
 * Reordena os avisos
 */
export function reorderWarnings(orderedIds) {
    const db = getDatabase();
    const updateStmt = db.prepare('UPDATE warnings SET "order" = ? WHERE id = ?');
    
    const transaction = db.transaction((ids) => {
        ids.forEach((id, index) => {
            updateStmt.run(index + 1, id);
        });
    });
    
    transaction(orderedIds);
    return listWarnings();
}

/**
 * Salva um arquivo de mídia para um aviso
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} filename - Nome original do arquivo
 * @returns {string} Caminho relativo do arquivo salvo
 */
export function saveMediaFile(fileBuffer, filename) {
    const uploadsPath = getUploadsPath();
    const ext = path.extname(filename);
    const uniqueName = `${generateUUID()}${ext}`;
    const filePath = path.join(uploadsPath, uniqueName);
    
    fs.writeFileSync(filePath, fileBuffer);
    console.log('[Warnings] Saved media file:', filePath);
    
    // Retorna o caminho como URL local
    return `local://${uniqueName}`;
}

/**
 * Obtém o caminho absoluto de um arquivo de mídia local
 */
export function getMediaFilePath(localUrl) {
    if (!localUrl || !localUrl.startsWith('local://')) {
        return localUrl; // Retorna como está se não for URL local
    }
    
    const filename = localUrl.replace('local://', '');
    const uploadsPath = getUploadsPath();
    return path.join(uploadsPath, filename);
}

/**
 * Limpa todos os avisos e arquivos de mídia
 */
export function clearAllWarnings() {
    const db = getDatabase();
    
    // Limpa a pasta de uploads
    try {
        const uploadsPath = getUploadsPath();
        fs.emptyDirSync(uploadsPath);
        console.log('[Warnings] Cleared uploads folder');
    } catch (error) {
        console.error('[Warnings] Error clearing uploads:', error);
    }
    
    db.exec('DELETE FROM warnings');
    return true;
}

/**
 * Normaliza os campos booleanos de um aviso do SQLite
 */
function normalizeWarning(warning) {
    if (!warning) return null;
    return {
        ...warning,
        active: Boolean(warning.active),
        priority: Boolean(warning.priority)
    };
}

export default {
    listWarnings,
    listActiveWarnings,
    getWarningById,
    addWarning,
    updateWarning,
    removeWarning,
    toggleWarningActive,
    reorderWarnings,
    saveMediaFile,
    getMediaFilePath,
    clearAllWarnings
};

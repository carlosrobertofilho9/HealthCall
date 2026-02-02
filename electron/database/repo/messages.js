import { getDatabase, generateUUID } from '../db.js';

/**
 * Repositório para operações de chat (Mensagens)
 */

/**
 * Adiciona uma nova mensagem
 */
export function addMessage({ content, sender_id, sender_name, type = 'text' }) {
    const db = getDatabase();
    const id = generateUUID();
    const timestamp = Date.now();
    
    const stmt = db.prepare(`
        INSERT INTO messages (id, content, sender_id, sender_name, type, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run(id, content, sender_id, sender_name, type, timestamp);
    return getMessageById(id);
}

/**
 * Busca uma mensagem pelo ID
 */
export function getMessageById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    return stmt.get(id);
}

/**
 * Busca histórico de mensagens
 * @param {number} limit Limite de mensagens (default 50)
 * @param {number} beforeTimestamp Buscar mensagens antes deste timestamp (paginação)
 */
export function getMessages(limit = 50, beforeTimestamp = null) {
    const db = getDatabase();
    let query = 'SELECT * FROM messages';
    const params = [];

    if (beforeTimestamp) {
        query += ' WHERE timestamp < ?';
        params.push(beforeTimestamp);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const messages = stmt.all(...params);
    
    // Retorna em ordem cronológica (mais antigo -> mais novo) para o chat
    return messages.reverse();
}

/**
 * Limpa mensagens antigas
 * @param {number} days Dias para manter
 */
export function cleanupOldMessages(days = 30) {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const timestamp = cutoffDate.getTime();

    const stmt = db.prepare('DELETE FROM messages WHERE timestamp < ?');
    const result = stmt.run(timestamp);
    
    return result.changes;
}

/**
 * Remove todas as mensagens (Limpar chat)
 */
export function clearAllMessages() {
    const db = getDatabase();
    db.exec('DELETE FROM messages');
    return true;
}

export default {
    addMessage,
    getMessageById,
    getMessages,
    cleanupOldMessages,
    clearAllMessages
};

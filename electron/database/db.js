import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

/**
 * Inicializa o banco de dados SQLite
 * Cria o arquivo do banco e executa o schema inicial se necessário
 */
export function initDatabase() {
    if (db) return db;

    // Caminho para o banco de dados
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'healthcall.db');
    
    // Garante que o diretório existe
    fs.ensureDirSync(userDataPath);
    
    console.log('[Database] Initializing SQLite database at:', dbPath);
    
    // Abre ou cria o banco de dados
    db = new Database(dbPath);
    
    // Habilita chaves estrangeiras
    db.pragma('foreign_keys = ON');
    
    // Executa o schema inicial
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schema);
        console.log('[Database] Schema applied successfully');
    }
    
    return db;
}

/**
 * Retorna a instância do banco de dados
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Fecha a conexão com o banco de dados
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Connection closed');
    }
}

/**
 * Gera um UUID v4
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Retorna o caminho para uploads locais
 */
export function getUploadsPath() {
    const userDataPath = app.getPath('userData');
    const uploadsPath = path.join(userDataPath, 'uploads', 'warnings');
    fs.ensureDirSync(uploadsPath);
    return uploadsPath;
}

export default {
    initDatabase,
    getDatabase,
    closeDatabase,
    generateUUID,
    getUploadsPath
};

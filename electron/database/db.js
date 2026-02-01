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
    
    // Executa migrações
    runMigrations();
    
    return db;
}

/**
 * Executa migrações pendentes
 */
function runMigrations() {
    const migrationsPath = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsPath)) {
        console.log('[Database] No migrations folder found');
        return;
    }
    
    // Cria tabela de controle de migrações se não existir
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at TEXT DEFAULT (datetime('now'))
        )
    `);
    
    // Lista migrações já aplicadas
    const applied = db.prepare('SELECT name FROM _migrations').all().map(r => r.name);
    
    // Lista arquivos de migração
    const files = fs.readdirSync(migrationsPath)
        .filter(f => f.endsWith('.sql'))
        .sort();
    
    for (const file of files) {
        if (applied.includes(file)) {
            continue;
        }
        
        console.log('[Database] Applying migration:', file);
        try {
            const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');
            db.exec(sql);
            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
            console.log('[Database] Migration applied successfully:', file);
        } catch (error) {
            console.error('[Database] Migration failed:', file, error.message);
            // Continua com próximas migrações (algumas podem já estar aplicadas manualmente)
        }
    }
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

/**
 * Retorna o caminho para áudios TTS pré-gerados
 */
export function getTTSAudioPath() {
    const userDataPath = app.getPath('userData');
    const audioPath = path.join(userDataPath, 'tts_audio');
    fs.ensureDirSync(audioPath);
    return audioPath;
}

/**
 * Retorna o caminho para a pasta de áudios de pacientes
 */
export function getPatientAudioPath() {
    return path.join(app.getPath('userData'), 'patient_audio');
}

/**
 * Limpa áudios TTS órfãos (não associados a nenhum aviso ativo)
 * Mantém áudios por 1 dia antes de excluir
 */
export function cleanupOrphanedTTSAudio() {
    const audioPath = getTTSAudioPath();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    try {
        // Busca todos os áudios em uso pelos avisos
        const usedAudios = new Set();
        const warnings = db.prepare('SELECT audio_url FROM warnings WHERE audio_url IS NOT NULL').all();
        warnings.forEach(w => {
            if (w.audio_url) {
                // Extrai nome do arquivo da URL
                const filename = w.audio_url.split('/').pop();
                usedAudios.add(filename);
            }
        });
        
        // Lista arquivos na pasta de áudio
        if (fs.existsSync(audioPath)) {
            const files = fs.readdirSync(audioPath);
            let cleaned = 0;
            
            for (const file of files) {
                // Ignora arquivos em uso
                if (usedAudios.has(file)) continue;
                
                const filePath = path.join(audioPath, file);
                const stats = fs.statSync(filePath);
                
                // Só exclui se tem mais de 1 dia
                if (stats.mtimeMs < oneDayAgo) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                    console.log('[Database] Cleaned orphaned warning audio:', file);
                }
            }
            
            if (cleaned > 0) {
                console.log(`[Database] Cleaned ${cleaned} orphaned warning audio files`);
            }
        }
    } catch (error) {
        console.error('[Database] Error cleaning warning audio:', error.message);
    }
    
    // Também limpa áudios de pacientes órfãos
    cleanupOrphanedPatientAudio();
}

/**
 * Limpa áudios de pacientes órfãos (não associados a nenhum paciente)
 */
export function cleanupOrphanedPatientAudio() {
    const audioPath = getPatientAudioPath();
    
    try {
        if (!fs.existsSync(audioPath)) return;
        
        // Busca todos os IDs de pacientes com áudio
        const usedPatientIds = new Set();
        const patients = db.prepare('SELECT id FROM patients WHERE audio_url IS NOT NULL').all();
        patients.forEach(p => usedPatientIds.add(p.id));
        
        // Lista arquivos na pasta de áudio de pacientes
        const files = fs.readdirSync(audioPath);
        let cleaned = 0;
        
        for (const file of files) {
            // Extrai ID do paciente do nome do arquivo (patient_{id}.aiff)
            const match = file.match(/^patient_(.+)\.(aiff|wav|mp3)$/);
            if (!match) {
                // Arquivo com formato inválido, pode remover
                fs.unlinkSync(path.join(audioPath, file));
                cleaned++;
                continue;
            }
            
            const patientId = match[1];
            
            // Se o paciente não existe mais, remove o áudio
            if (!usedPatientIds.has(patientId)) {
                fs.unlinkSync(path.join(audioPath, file));
                cleaned++;
                console.log('[Database] Cleaned orphaned patient audio:', file);
            }
        }
        
        if (cleaned > 0) {
            console.log(`[Database] Cleaned ${cleaned} orphaned patient audio files`);
        }
    } catch (error) {
        console.error('[Database] Error cleaning patient audio:', error.message);
    }
}

export default {
    initDatabase,
    getDatabase,
    closeDatabase,
    generateUUID,
    getUploadsPath,
    getTTSAudioPath,
    getPatientAudioPath,
    cleanupOrphanedTTSAudio,
    cleanupOrphanedPatientAudio
};

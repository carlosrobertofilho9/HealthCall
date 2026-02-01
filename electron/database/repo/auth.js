import { getDatabase, generateUUID } from '../db.js';
import crypto from 'crypto';

/**
 * Hash simples para senhas usando SHA-256
 * Em produção, use bcrypt, mas para simplificar usamos SHA-256 com salt
 */
function hashPassword(password) {
    const salt = 'healthcall-local-salt-2024';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Verifica se a senha corresponde ao hash
 */
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

/**
 * Busca usuário por email
 */
export function getUserByEmail(email) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
}

/**
 * Busca usuário por ID
 */
export function getUserById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/**
 * Autentica usuário com email e senha
 * @returns {Object|null} Usuário se autenticado, null se falhar
 */
export function authenticate(email, password) {
    const user = getUserByEmail(email);
    
    if (!user) {
        return null;
    }
    
    // Para o usuário padrão inicial, aceita a senha 'admin123' diretamente
    if (user.id === 'default-admin-user' && user.is_first_login === 1) {
        if (password === 'admin123') {
            // Retorna o usuário sem a senha
            const { password_hash, ...safeUser } = user;
            return safeUser;
        }
    }
    
    // Verifica a senha com hash
    if (verifyPassword(password, user.password_hash)) {
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
    
    return null;
}

/**
 * Cria um novo usuário (ou atualiza credenciais do usuário padrão)
 */
export function createUser(email, password, name) {
    const db = getDatabase();
    const hashedPassword = hashPassword(password);
    const id = generateUUID();
    
    try {
        const stmt = db.prepare(`
            INSERT INTO users (id, email, password_hash, name, is_first_login)
            VALUES (?, ?, ?, ?, 0)
        `);
        
        stmt.run(id, email.toLowerCase(), hashedPassword, name);
        return getUserById(id);
    } catch (error) {
        // Se o email já existe, lança erro
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('Email já cadastrado');
        }
        throw error;
    }
}

/**
 * Atualiza as credenciais do usuário (usado no primeiro login)
 */
export function updateCredentials(userId, newEmail, newPassword, newName) {
    const db = getDatabase();
    const hashedPassword = hashPassword(newPassword);
    
    try {
        const stmt = db.prepare(`
            UPDATE users 
            SET email = ?, password_hash = ?, name = ?, is_first_login = 0, updated_at = datetime('now')
            WHERE id = ?
        `);
        
        const result = stmt.run(newEmail.toLowerCase(), hashedPassword, newName, userId);
        
        if (result.changes === 0) {
            throw new Error('Usuário não encontrado');
        }
        
        return getUserById(userId);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('Email já cadastrado');
        }
        throw error;
    }
}

/**
 * Verifica se é o primeiro login do usuário
 */
export function isFirstLogin(userId) {
    const user = getUserById(userId);
    return user ? user.is_first_login === 1 : false;
}

/**
 * Lista todos os usuários (sem senhas)
 */
export function listUsers() {
    const db = getDatabase();
    const users = db.prepare('SELECT id, email, name, default_destination, is_first_login, created_at, updated_at FROM users').all();
    return users;
}

/**
 * Atualiza o destino padrão do usuário
 */
export function updateUserDestination(userId, destination) {
    const db = getDatabase();
    
    const stmt = db.prepare(`
        UPDATE users 
        SET default_destination = ?, updated_at = datetime('now')
        WHERE id = ?
    `);
    
    const result = stmt.run(destination, userId);
    
    if (result.changes === 0) {
        throw new Error('Usuário não encontrado');
    }
    
    return getUserById(userId);
}

/**
 * Remove um usuário
 */
export function removeUser(id) {
    const db = getDatabase();
    
    // Não permite remover o último usuário
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (count.count <= 1) {
        throw new Error('Não é possível remover o único usuário');
    }
    
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Inicializa o usuário padrão se não existir nenhum
 */
export function ensureDefaultUser() {
    const db = getDatabase();
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (count.count === 0) {
        const hashedPassword = hashPassword('admin123');
        const stmt = db.prepare(`
            INSERT INTO users (id, email, password_hash, name, is_first_login)
            VALUES (?, ?, ?, ?, 1)
        `);
        stmt.run('default-admin-user', 'admin@healthcall.local', hashedPassword, 'Administrador');
        console.log('[Auth] Usuário padrão criado: admin@healthcall.local / admin123');
    }
}

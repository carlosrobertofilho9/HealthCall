import { getDatabase, generateUUID } from '../db.js';

/**
 * Repositório para operações com pacientes
 */

/**
 * Lista todos os pacientes ordenados por data de criação (mais recentes primeiro)
 */
export function listPatients() {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM patients 
        ORDER BY created_at DESC
    `);
    return stmt.all();
}

/**
 * Lista pacientes por status
 */
export function listPatientsByStatus(status) {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM patients 
        WHERE status = ? 
        ORDER BY created_at ASC
    `);
    return stmt.all(status);
}

/**
 * Busca um paciente pelo ID
 */
export function getPatientById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    return stmt.get(id);
}

/**
 * Adiciona um novo paciente
 */
export function addPatient({ name, destination, status = 'Aguardando' }) {
    const db = getDatabase();
    const id = generateUUID();
    const stmt = db.prepare(`
        INSERT INTO patients (id, name, destination, status, callCount, created_at)
        VALUES (?, ?, ?, ?, 0, datetime('now'))
    `);
    stmt.run(id, name, destination, status);
    return getPatientById(id);
}

/**
 * Obtém o próximo número de ficha disponível
 */
export function getNextFichaNumber() {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT MAX(CAST(REPLACE(name, 'Ficha ', '') AS INTEGER)) as maxNum 
        FROM patients 
        WHERE name LIKE 'Ficha %'
    `);
    const result = stmt.get();
    return (result?.maxNum || 0) + 1;
}

/**
 * Adiciona um paciente com número de ficha sequencial
 */
export function addPatientByNumber(destination) {
    const nextNumber = getNextFichaNumber();
    const name = `Ficha ${nextNumber}`;
    return addPatient({ name, destination });
}

/**
 * Atualiza um paciente existente
 */
export function updatePatient(id, updates) {
    const db = getDatabase();
    const current = getPatientById(id);
    if (!current) return null;

    const { name, destination, status, callCount, audio_url } = { ...current, ...updates };
    
    const stmt = db.prepare(`
        UPDATE patients 
        SET name = ?, destination = ?, status = ?, callCount = ?, audio_url = ?
        WHERE id = ?
    `);
    stmt.run(name, destination, status, callCount, audio_url, id);
    return getPatientById(id);
}

/**
 * Chama um paciente (atualiza status e cria registro de chamada)
 */
export function callPatient(id, destination) {
    const db = getDatabase();
    const patient = getPatientById(id);
    if (!patient) return null;

    const newCallCount = patient.callCount + 1;
    
    // Atualiza status do paciente
    const updateStmt = db.prepare(`
        UPDATE patients 
        SET status = 'Chamado', callCount = ?
        WHERE id = ?
    `);
    updateStmt.run(newCallCount, id);

    // Cria registro de chamada
    const callId = generateUUID();
    const callStmt = db.prepare(`
        INSERT INTO calls (id, patient_id, location, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `);
    callStmt.run(callId, id, destination);

    return getPatientById(id);
}

/**
 * Remove um paciente
 */
export function removePatient(id) {
    const db = getDatabase();
    // Primeiro remove chamadas relacionadas (devido ao FK)
    const deleteCallsStmt = db.prepare('DELETE FROM calls WHERE patient_id = ?');
    deleteCallsStmt.run(id);
    
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Limpa todos os pacientes e chamadas
 */
export function clearAllPatients() {
    const db = getDatabase();
    db.exec('DELETE FROM calls');
    db.exec('DELETE FROM patients');
    return true;
}

/**
 * Busca pacientes com status 'Aguardando'
 */
export function getWaitingPatients() {
    return listPatientsByStatus('Aguardando');
}

/**
 * Busca o último paciente chamado
 */
export function getLastCalledPatient() {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT * FROM patients 
        WHERE status = 'Chamado' 
        ORDER BY created_at DESC 
        LIMIT 1
    `);
    return stmt.get() || null;
}

/**
 * Busca o histórico de chamadas recentes
 */
export function getCallHistory(limit = 10) {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT c.*, p.name, p.callCount
        FROM calls c
        JOIN patients p ON c.patient_id = p.id
        ORDER BY c.created_at DESC
        LIMIT ?
    `);
    const results = stmt.all(limit);
    
    // Formata para o formato esperado pelo frontend
    const seen = new Set();
    return results
        .filter(call => {
            if (seen.has(call.patient_id)) return false;
            seen.add(call.patient_id);
            return true;
        })
        .map(call => ({
            id: call.patient_id,
            name: call.name,
            destination: call.location,
            callCount: call.callCount,
            calledAt: new Date(call.created_at).getTime()
        }));
}

/**
 * Busca a última chamada feita
 */
export function getLastCall() {
    const db = getDatabase();
    const stmt = db.prepare(`
        SELECT c.*, p.*
        FROM calls c
        JOIN patients p ON c.patient_id = p.id
        ORDER BY c.created_at DESC
        LIMIT 1
    `);
    const result = stmt.get();
    
    if (!result) return null;
    
    return {
        patient: {
            id: result.patient_id,
            name: result.name,
            destination: result.destination,
            status: result.status,
            callCount: result.callCount
        },
        location: result.location
    };
}

/**
 * Obtém destinos únicos
 */
export function getUniqueDestinations() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT DISTINCT destination FROM patients');
    return stmt.all().map(row => row.destination);
}

/**
 * Limpa dados antigos (chamadas e pacientes finalizados)
 * @param {number} retentionMs Tempo de retenção em milissegundos
 */
export function cleanupOldData(retentionMs) {
    const db = getDatabase();
    
    // Calcula data de corte (agora - retencao)
    // SQLite datetime('now', '-1 day') funciona, mas vamos usar parametro para flexibilidade
    const cutoffDate = new Date(Date.now() - retentionMs).toISOString();
    
    console.log(`[Database] Cleaning data older than ${cutoffDate}`);
    
    // 1. Apagar chamadas antigas
    const deleteCalls = db.prepare(`
        DELETE FROM calls 
        WHERE created_at < ?
    `);
    const callsResult = deleteCalls.run(cutoffDate);
    
    // 2. Apagar pacientes antigos que NÃO estão aguardando
    // (Mantém pacientes na fila mesmo que estejam lá há muito tempo)
    const deletePatients = db.prepare(`
        DELETE FROM patients 
        WHERE created_at < ? 
        AND status != 'Aguardando'
    `);
    const patientsResult = deletePatients.run(cutoffDate);
    
    // 3. VACUUM para liberar espaço (opcional, pode ser pesado)
    // db.exec('VACUUM'); 
    
    return {
        callsRemoved: callsResult.changes,
        patientsRemoved: patientsResult.changes
    };
}

export default {
    listPatients,
    listPatientsByStatus,
    getPatientById,
    addPatient,
    addPatientByNumber,
    getNextFichaNumber,
    updatePatient,
    callPatient,
    removePatient,
    clearAllPatients,
    getWaitingPatients,
    getLastCalledPatient,
    getCallHistory,
    getLastCall,
    getUniqueDestinations,
    cleanupOldData // Exportar nova função
};

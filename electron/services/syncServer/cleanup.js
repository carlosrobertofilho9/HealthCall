import { patientsRepo } from '../../database/index.js';
import { notifyDataUpdate } from './socket.js';
import { DATA_RETENTION } from './config.js';

export function runAutoCleanup() {
    console.log('[SyncServer] Executing auto-cleanup task...');
    try {
        // Limpar chamadas e pacientes antigos
        console.log(`[SyncServer] Retenção configurada para: ${DATA_RETENTION / 3600000} horas`);
        
        // Executar limpeza no banco
        const result = patientsRepo.cleanupOldData(DATA_RETENTION);
        
        if (result.callsRemoved > 0 || result.patientsRemoved > 0) {
            console.log(`[SyncServer] Limpeza concluída: ${result.callsRemoved} chamadas, ${result.patientsRemoved} pacientes removidos.`);
            
            // Notificar clientes para atualizarem suas listas se houver mudanças visíveis
            if (result.patientsRemoved > 0) {
                notifyDataUpdate('patients', 'refresh');
            }
        }
    } catch (error) {
        console.error('[SyncServer] Auto-cleanup failed:', error);
    }
}

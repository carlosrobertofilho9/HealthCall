import { WebSocketServer, WebSocket } from 'ws';
import state, { syncEvents } from './state.js';
import { HEARTBEAT_INTERVAL } from './config.js';
import { patientsRepo, warningsRepo, settingsRepo } from '../../database/index.js';
import { getMediaUrl, getWarningAudioUrl } from '../audioServer.js';

/**
 * Broadcast uma mensagem para todos os clientes conectados
 */
export function broadcast(message, excludeClient = null) {
    const data = JSON.stringify(message);
    state.connectedClients.forEach((_, client) => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

/**
 * Notifica todos os clientes sobre uma atualização de dados
 */
export function notifyDataUpdate(table, action = 'update', data = null) {
    broadcast({
        type: 'data_update',
        table,
        action,
        data,
        timestamp: Date.now()
    });
    
    // Emitir evento para o processo local (main.js)
    syncEvents.emit('server-update', { table, action, data });
}

function heartbeat() {
    this.isAlive = true;
}

export function startHeartbeat() {
    state.heartbeatInterval = setInterval(() => {
        state.wss.clients.forEach((ws) => {
            const clientData = state.connectedClients.get(ws);
            if (!clientData) return;
            
            if (clientData.isAlive === false) {
                console.log(`[SyncServer] Cliente inativo, desconectando: ${clientData.ip} (${clientData.id})`);
                return ws.terminate();
            }
            
            clientData.isAlive = false;
            ws.ping();
        });
    }, HEARTBEAT_INTERVAL);
}

export function initWebSocket(httpServer) {
    state.wss = new WebSocketServer({ server: httpServer });

    state.wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        
        // Armazena metadados do cliente
        const clientData = {
            ip: clientIp,
            joinedAt: Date.now(),
            id: Math.random().toString(36).substring(2, 9),
            isAlive: true
        };
        
        state.connectedClients.set(ws, clientData);
        
        ws.on('pong', () => {
             const data = state.connectedClients.get(ws);
             if (data) data.isAlive = true;
        });
        
        console.log(`[SyncServer] Cliente conectado: ${clientIp} (${clientData.id})`);

        // Envia status inicial
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Conectado ao HealthCall Sync Server',
            clients: state.connectedClients.size,
            clientId: clientData.id,
            timestamp: Date.now()
        }));

        // Broadcast para outros clientes
        broadcast({
            type: 'client_joined',
            clients: state.connectedClients.size,
            client: clientData,
            timestamp: Date.now()
        }, ws);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                
                // Trata diferentes tipos de mensagens
                switch (data.type) {
                    case 'ping':
                        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                        break;
                    
                    case 'identify':
                        // Cliente enviou identificação (nome do dispositivo, etc)
                        if (data.deviceName) {
                            state.connectedClients.get(ws).deviceName = data.deviceName;
                        }
                        break;
                        
                    case 'request_sync':
                        // Cliente solicita sincronização completa
                        ws.send(JSON.stringify({
                            type: 'full_sync',
                            data: {
                                patients: patientsRepo.listPatients(),
                                warnings: warningsRepo.listWarnings().map(w => ({
                                    ...w,
                                    media_url: getMediaUrl(w.media_url),
                                    audio_url: w.audio_url ? getWarningAudioUrl(w.audio_url.split('/').pop()) : null
                                })),
                                settings: settingsRepo.getAllSettings(),

                            },
                            timestamp: Date.now()
                        }));
                        break;
                    
                    default:
                        console.log('[SyncServer] Mensagem desconhecida:', data.type);
                }
            } catch (error) {
                console.error('[SyncServer] Erro ao processar mensagem:', error);
            }
        });

        ws.on('close', () => {
            console.log(`[SyncServer] Cliente desconectado: ${clientIp} (${clientData.id})`);
            state.connectedClients.delete(ws);
            
            // Notifica outros clientes
            broadcast({
                type: 'client_left',
                clients: state.connectedClients.size,
                clientId: clientData.id,
                timestamp: Date.now()
            });
        });

        ws.on('error', (error) => {
            console.error(`[SyncServer] Erro no WebSocket: ${error.message}`);
            state.connectedClients.delete(ws);
        });
    });

    startHeartbeat();
}

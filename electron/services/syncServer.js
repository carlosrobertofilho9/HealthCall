/**
 * Servidor de Sincronização via WebSocket
 * 
 * Este servidor permite que múltiplos clientes (computadores na rede)
 * se conectem e mantenham seus dados sincronizados em tempo real.
 * 
 * Funcionalidades:
 * - WebSocket para comunicação em tempo real
 * - REST API para operações CRUD
 * - Broadcast de atualizações para todos os clientes conectados
 * - Descoberta automática do servidor na rede local
 */

import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import http from 'http';
import os from 'os';
import { 
    patientsRepo, 
    warningsRepo, 
    settingsRepo,
} from '../database/index.js';
import { getMediaUrl, getWarningAudioUrl, getPatientAudioUrl } from './audioServer.js';

const SYNC_PORT = 3457; // Porta para sincronização
let httpServer = null;
let wss = null;
let connectedClients = new Map(); // Map<WebSocket, ClientData>

/**
 * Obtém todos os IPs da máquina na rede
 */
export function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Pula endereços internos e IPv6
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({
                    interface: name,
                    address: iface.address,
                    url: `http://${iface.address}:${SYNC_PORT}`
                });
            }
        }
    }
    
    // Adiciona localhost também
    addresses.unshift({
        interface: 'localhost',
        address: '127.0.0.1',
        url: `http://127.0.0.1:${SYNC_PORT}`
    });
    
    return addresses;
}

/**
 * Broadcast uma mensagem para todos os clientes conectados
 */
function broadcast(message, excludeClient = null) {
    const data = JSON.stringify(message);
    connectedClients.forEach((_, client) => {
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
}

/**
 * Inicia o servidor de sincronização
 */
export function startSyncServer() {
    if (httpServer) {
        console.log('[SyncServer] Servidor já está rodando');
        return;
    }

    const app = express();
    
    // Middlewares
    app.use(cors({
        origin: '*', // Permite qualquer origem na rede local
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());

    // ============================================
    // Endpoint de descoberta/status
    // ============================================
    app.get('/api/status', (req, res) => {
        res.json({
            success: true,
            server: 'HealthCall Sync Server',
            version: '1.0.0',
            clients: connectedClients.size,
            addresses: getNetworkAddresses(),
            timestamp: Date.now()
        });
    });

    // ... (REST API endpoints preserved as they are) ...
    // ============================================
    // REST API - Pacientes
    // ============================================
    app.get('/api/patients', (req, res) => {
        try {
            const patients = patientsRepo.listPatients();
            res.json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/patients/waiting', (req, res) => {
        try {
            const patients = patientsRepo.getWaitingPatients();
            res.json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/patients/:id', (req, res) => {
        try {
            const patient = patientsRepo.getPatientById(req.params.id);
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/patients', (req, res) => {
        try {
            const { name, destination } = req.body;
            const patient = patientsRepo.addPatient({ name, destination });
            notifyDataUpdate('patients', 'insert', patient);
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/patients/ficha', (req, res) => {
        try {
            const { destination } = req.body;
            const patient = patientsRepo.addPatientByNumber(destination);
            notifyDataUpdate('patients', 'insert', patient);
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/patients/:id', (req, res) => {
        try {
            const patient = patientsRepo.updatePatient(req.params.id, req.body);
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            notifyDataUpdate('patients', 'update', patient);
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/patients/:id/call', (req, res) => {
        try {
            const { destination } = req.body;
            const patient = patientsRepo.callPatient(req.params.id, destination);
            if (!patient) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            // Notifica especificamente sobre a chamada
            notifyDataUpdate('calls', 'insert', { 
                patient, 
                location: destination,
                timestamp: Date.now()
            });
            res.json({ success: true, data: patient });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/patients/:id', (req, res) => {
        try {
            const success = patientsRepo.removePatient(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, error: 'Paciente não encontrado' });
            }
            notifyDataUpdate('patients', 'delete', { id: req.params.id });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/patients', (req, res) => {
        try {
            patientsRepo.clearAllPatients();
            notifyDataUpdate('patients', 'clear');
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ============================================
    // REST API - Chamadas
    // ============================================
    app.get('/api/calls/last', (req, res) => {
        try {
            const lastCall = patientsRepo.getCallHistory(1)[0];
            if (!lastCall) {
                return res.json({ success: true, data: null });
            }
            const patient = patientsRepo.getPatientById(lastCall.id);
            res.json({ 
                success: true, 
                data: patient ? { 
                    patient, 
                    location: lastCall.destination 
                } : null 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/calls/history', (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const history = patientsRepo.getCallHistory(limit);
            res.json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ============================================
    // REST API - Avisos
    // ============================================
    app.get('/api/warnings', (req, res) => {
        try {
            const warnings = warningsRepo.listWarnings();
            // Converte URLs locais para HTTP
            const processedWarnings = warnings.map(w => ({
                ...w,
                media_url: getMediaUrl(w.media_url),
                audio_url: w.audio_url ? getWarningAudioUrl(w.audio_url.split('/').pop()) : null
            }));
            res.json({ success: true, data: processedWarnings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/warnings/active', (req, res) => {
        try {
            const warnings = warningsRepo.listActiveWarnings();
            // Converte URLs locais para HTTP
            const processedWarnings = warnings.map(w => ({
                ...w,
                media_url: getMediaUrl(w.media_url),
                audio_url: w.audio_url ? getWarningAudioUrl(w.audio_url.split('/').pop()) : null
            }));
            res.json({ success: true, data: processedWarnings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/warnings/:id', (req, res) => {
        try {
            const warning = warningsRepo.getWarningById(req.params.id);
            if (!warning) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }
            res.json({ 
                success: true, 
                data: {
                    ...warning,
                    media_url: getMediaUrl(warning.media_url),
                    audio_url: warning.audio_url ? getWarningAudioUrl(warning.audio_url.split('/').pop()) : null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/warnings', (req, res) => {
        try {
            const warning = warningsRepo.addWarning(req.body);
            notifyDataUpdate('warnings', 'insert', warning);
            res.json({ success: true, data: warning });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/warnings/:id', (req, res) => {
        try {
            const warning = warningsRepo.updateWarning(req.params.id, req.body);
            if (!warning) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }
            notifyDataUpdate('warnings', 'update', warning);
            res.json({ success: true, data: warning });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.delete('/api/warnings/:id', (req, res) => {
        try {
            const success = warningsRepo.removeWarning(req.params.id);
            if (!success) {
                return res.status(404).json({ success: false, error: 'Aviso não encontrado' });
            }
            notifyDataUpdate('warnings', 'delete', { id: req.params.id });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ============================================
    // REST API - Configurações
    // ============================================
    app.get('/api/settings', (req, res) => {
        try {
            const settings = settingsRepo.getAllSettings();
            res.json({ success: true, data: settings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/settings/:key', (req, res) => {
        try {
            const value = settingsRepo.getSetting(req.params.key);
            res.json({ success: true, data: { key: req.params.key, value } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/settings/:key', (req, res) => {
        try {
            const { value } = req.body;
            settingsRepo.setSetting(req.params.key, value);
            notifyDataUpdate('settings', 'update', { key: req.params.key, value });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ============================================
    // REST API - Destinos
    // ============================================
    app.get('/api/destinations', (req, res) => {
        try {
            const destinations = patientsRepo.listPatients()
                .map(p => p.destination)
                .filter((v, i, a) => v && a.indexOf(v) === i);
            res.json({ success: true, data: destinations });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ============================================
    // Criar servidor HTTP
    // ============================================
    httpServer = http.createServer(app);

    // ============================================
    // WebSocket Server
    // ============================================
    wss = new WebSocketServer({ server: httpServer });

    wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        
        // Armazena metadados do cliente
        const clientData = {
            ip: clientIp,
            joinedAt: Date.now(),
            id: Math.random().toString(36).substring(2, 9)
        };
        
        connectedClients.set(ws, clientData);
        
        console.log(`[SyncServer] Cliente conectado: ${clientIp} (${clientData.id})`);

        // Envia status inicial
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Conectado ao HealthCall Sync Server',
            clients: connectedClients.size,
            clientId: clientData.id,
            timestamp: Date.now()
        }));

        // Broadcast para outros clientes
        broadcast({
            type: 'client_joined',
            clients: connectedClients.size,
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
                            connectedClients.get(ws).deviceName = data.deviceName;
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
                                settings: settingsRepo.getAllSettings()
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
            connectedClients.delete(ws);
            
            // Notifica outros clientes
            broadcast({
                type: 'client_left',
                clients: connectedClients.size,
                clientId: clientData.id,
                timestamp: Date.now()
            });
        });

        ws.on('error', (error) => {
            console.error(`[SyncServer] Erro no WebSocket: ${error.message}`);
            connectedClients.delete(ws);
        });
    });

    // ============================================
    // Iniciar servidor
    // ============================================
    httpServer.listen(SYNC_PORT, '0.0.0.0', () => {
        const addresses = getNetworkAddresses();
        console.log('[SyncServer] ========================================');
        console.log('[SyncServer] Servidor de Sincronização iniciado!');
        console.log('[SyncServer] Porta:', SYNC_PORT);
        console.log('[SyncServer] Endereços disponíveis:');
        addresses.forEach(addr => {
            console.log(`[SyncServer]   - ${addr.interface}: ${addr.url}`);
        });
        console.log('[SyncServer] WebSocket: ws://IP:' + SYNC_PORT);
        console.log('[SyncServer] ========================================');
    });

    httpServer.on('error', (error) => {
        console.error('[SyncServer] Erro no servidor:', error.message);
    });
}

/**
 * Para o servidor de sincronização
 */
export function stopSyncServer() {
    if (wss) {
        // Fecha todas as conexões WebSocket
        connectedClients.forEach((_, client) => {
            client.close();
        });
        connectedClients.clear();
        wss.close();
        wss = null;
    }
    
    if (httpServer) {
        httpServer.close();
        httpServer = null;
    }
    
    console.log('[SyncServer] Servidor parado');
}

/**
 * Retorna informações sobre o servidor
 */
export function getServerInfo() {
    return {
        running: !!httpServer,
        port: SYNC_PORT,
        clients: connectedClients.size,
        addresses: getNetworkAddresses(),
        clientsList: Array.from(connectedClients.values())
    };
}

export default {
    startSyncServer,
    stopSyncServer,
    getServerInfo,
    getNetworkAddresses,
    notifyDataUpdate
};

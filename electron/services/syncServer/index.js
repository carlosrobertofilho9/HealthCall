import express from 'express';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import { SYNC_PORT, CLEANUP_INTERVAL } from './config.js';
import state from './state.js';
import { getNetworkAddresses } from './utils.js';
import { runAutoCleanup } from './cleanup.js';
import { initWebSocket, notifyDataUpdate, startHeartbeat } from './socket.js';
import { syncEvents } from './state.js';
import setupRoutes from './routes/index.js';

/**
 * Inicia o servidor de sincronização
 */
export function startSyncServer() {
    if (state.httpServer) {
        console.log('[SyncServer] Servidor já está rodando');
        return Promise.resolve(true);
    }

    // Iniciar Auto Cleanup Timer
    state.cleanupInterval = setInterval(runAutoCleanup, CLEANUP_INTERVAL);
    
    // Executar uma limpeza inicial
    setTimeout(runAutoCleanup, 5000);

    const app = express();
    
    // Middlewares
    app.use(compression()); // Enable GZIP compression
    app.use(cors({
        origin: '*', // Permite qualquer origem na rede local
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json({ limit: '50mb' })); // Increased limit for media uploads

    // --- Middleware: Rate Limiting ---
    const rateLimits = new Map(); // IP -> { count, resetTime }
    const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    const MAX_REQUESTS = 300; // 300 requests per minute

    app.use((req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress;
        const now = Date.now();
        
        let record = rateLimits.get(ip);
        if (!record || now > record.resetTime) {
            record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
            rateLimits.set(ip, record);
        }
        
        record.count++;
        
        if (record.count > MAX_REQUESTS) {
            console.warn(`[SyncServer] Rate limit exceeded for IP: ${ip}`);
            return res.status(429).json({ 
                success: false, 
                error: 'Too many requests. Please try again later.' 
            });
        }
        next();
    });

    // Setup Routes
    setupRoutes(app);

    // ============================================
    // Criar servidor HTTP
    // ============================================
    state.httpServer = http.createServer(app);

    // ============================================
    // WebSocket Server Initialization
    // ============================================
    initWebSocket(state.httpServer);

    // ============================================
    // Iniciar servidor
    // ============================================
    return new Promise((resolve, reject) => {
        state.httpServer.listen(SYNC_PORT, '0.0.0.0', () => {
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
            resolve(true); // Sucesso
        });

        state.httpServer.on('error', (error) => {
            console.error('[SyncServer] Erro no servidor:', error.message);
            stopSyncServer(); // Limpar em caso de erro
            reject(error);
        });
    });
}

/**
 * Para o servidor de sincronização
 */
export function stopSyncServer() {
    if (state.wss) {
        clearInterval(state.heartbeatInterval); // Stop Heartbeat
        clearInterval(state.cleanupInterval);   // Stop Cleanup
        
        // Fecha todas as conexões WebSocket
        state.connectedClients.forEach((_, client) => {
            client.close();
        });
        state.connectedClients.clear();
        state.wss.close();
        state.wss = null;
    }
    
    if (state.httpServer) {
        state.httpServer.close();
        state.httpServer = null;
    }
    
    console.log('[SyncServer] Servidor parado');
}

/**
 * Retorna informações sobre o servidor
 */
export function getServerInfo() {
    return {
        running: !!state.httpServer,
        port: SYNC_PORT,
        clients: state.connectedClients.size,
        addresses: getNetworkAddresses(),
        clientsList: Array.from(state.connectedClients.values())
    };
}

// Re-export specific functions for direct import usage if needed
export { getNetworkAddresses, notifyDataUpdate, syncEvents };

// Default export compatible with original structure
export default {
    startSyncServer,
    stopSyncServer,
    getServerInfo,
    getNetworkAddresses,
    notifyDataUpdate,
    syncEvents
};

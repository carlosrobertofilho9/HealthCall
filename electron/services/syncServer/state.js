import { EventEmitter } from 'events';

export const syncEvents = new EventEmitter();

const state = {
    httpServer: null,
    wss: null,
    connectedClients: new Map(), // Map<WebSocket, ClientData>
    cleanupInterval: null,
    heartbeatInterval: null
};

export default state;

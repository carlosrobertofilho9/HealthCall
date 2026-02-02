/**
 * Cliente de Sincronização para Electron
 * 
 * Quando o Electron opera em modo cliente (conectando a outro servidor),
 * este módulo gerencia a conexão WebSocket e sincronização de dados.
 */

import WebSocket from 'ws';
import http from 'http';
import { EventEmitter } from 'events';
import { saveConfig } from './serverDiscovery.js';

class ElectronSyncClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.serverUrl = null;
    this.wsUrl = null;
    this.connected = false;
    this.reconnectInterval = null;
    this.listeners = new Map();
    this.mainWindow = null;
  }

  /**
   * Define a janela principal para enviar eventos
   */
  setMainWindow(win) {
    this.mainWindow = win;
  }

  /**
   * Conecta ao servidor de sincronização
   */
  connect(serverInfo) {
    let url = serverInfo.url;
    let wsUrl = serverInfo.wsUrl;

    // Normalização: garantir porta se faltar
    try {
      if (url && !url.includes(':', url.indexOf('//') + 2)) {
        url = `${url}:3457`;
        wsUrl = wsUrl.replace(/:\d+$/, '') + ':3457';
      }
    } catch (e) {}

    this.serverUrl = url;
    this.wsUrl = wsUrl;
    
    console.log(`[ElectronSyncClient] Conectando a ${this.wsUrl}...`);
    
    // Salvar configuração para reconexão futura
    saveConfig({ serverUrl: this.serverUrl });
    
    this._connectWebSocket();
    return this;
  }

  /**
   * Estabelece conexão WebSocket
   */
  _connectWebSocket() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.on('open', () => {
        console.log('[ElectronSyncClient] Conectado ao servidor!');
        this.connected = true;
        this._stopReconnect();
        this._notifyRenderer('sync-connected', { serverUrl: this.serverUrl });
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this._handleMessage(message);
        } catch (error) {
          console.error('[ElectronSyncClient] Erro ao processar mensagem:', error);
        }
      });
      
      this.ws.on('close', () => {
        console.log('[ElectronSyncClient] Conexão fechada');
        this.connected = false;
        this._notifyRenderer('sync-disconnected', {});
        this._startReconnect();
      });
      
      this.ws.on('error', (error) => {
        console.error('[ElectronSyncClient] Erro WebSocket:', error.message);
        this._notifyRenderer('sync-error', { error: error.message });
      });
      
    } catch (error) {
      console.error('[ElectronSyncClient] Erro ao conectar:', error);
      this._startReconnect();
    }
  }

  /**
   * Processa mensagens recebidas do servidor
   */
  _handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('[ElectronSyncClient] Boas-vindas do servidor');
        break;
        
        break;
        
      case 'data_update':
        console.log(`[ElectronSyncClient] Atualização: ${message.table} - ${message.action}`);
        this.emit('data-update', message);
        this._notifyRenderer('sync-data-update', message);
        break;
        
      case 'full_sync':
        console.log('[ElectronSyncClient] Sincronização completa recebida');
        this.emit('full-sync', message.data);
        this._notifyRenderer('sync-full-data', message.data);
        // Também notifica o chat especificamente se houver dados
        if (message.data.chat) {
             this._notifyRenderer('chat-history', message.data.chat);
        }
        break;
        
      case 'client_joined':
      case 'client_left':
        console.log(`[ElectronSyncClient] ${message.type}: ${message.clients} clientes`);
        this.emit('clients-changed', { count: message.clients });
        this._notifyRenderer('sync-clients-changed', { count: message.clients });
        break;
        
      case 'pong':
        // Resposta ao ping
        break;
    }
  }

  /**
   * Notifica o renderer process
   */
  _notifyRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Inicia tentativas de reconexão
   */
  _startReconnect() {
    if (this.reconnectInterval) return;
    
    console.log('[ElectronSyncClient] Iniciando reconexão automática...');
    this.reconnectInterval = setInterval(() => {
      if (!this.connected) {
        console.log('[ElectronSyncClient] Tentando reconectar...');
        this._connectWebSocket();
      }
    }, 5000);
  }

  /**
   * Para tentativas de reconexão
   */
  _stopReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Desconecta do servidor
   */
  disconnect() {
    this._stopReconnect();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  // ============================================
  // Métodos de API REST
  // ============================================

  /**
   * Faz requisição HTTP ao servidor
   */
  async _request(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.serverUrl);
      
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }

  // Pacientes
  async getPatients() {
    return this._request('GET', '/api/patients');
  }

  async addPatient(name, destination) {
    return this._request('POST', '/api/patients', { name, destination });
  }

  async addPatientByNumber(destination) {
    return this._request('POST', '/api/patients/ficha', { destination });
  }


  async updatePatient(id, data) {
    return this._request('PUT', `/api/patients/${id}`, data);
  }

  async deletePatient(id) {
    return this._request('DELETE', `/api/patients/${id}`);
  }

  // Chamadas
  async getCalls() {
    return this._request('GET', '/api/calls');
  }

  async callPatient(patientId, location) {
    return this._request('POST', '/api/calls', { patientId, location });
  }

  // Avisos
  async getWarnings() {
    return this._request('GET', '/api/warnings');
  }

  async getActiveWarnings() {
    return this._request('GET', '/api/warnings/active');
  }


  async addWarning(warning) {
    return this._request('POST', '/api/warnings', warning);
  }

  async updateWarning(id, data) {
    return this._request('PUT', `/api/warnings/${id}`, data);
  }

  async deleteWarning(id) {
    return this._request('DELETE', `/api/warnings/${id}`);
  }

  // Configurações
  async getSettings() {
    return this._request('GET', '/api/settings');
  }

  async updateSettings(settings) {
    return this._request('PUT', '/api/settings', settings);
  }

  // Limpar fila
  async clearQueue() {
    return this._request('DELETE', '/api/patients/all');
  }

  // Chat
  async getChatHistory(limit = 50) {
    return this._request('GET', `/api/chat?limit=${limit}`);
  }

  async sendChatMessage(content, sender_id, sender_name, type = 'text') {
    return this._request('POST', '/api/chat', { content, sender_id, sender_name, type });
  }

  async clearChat() {
    return this._request('DELETE', '/api/chat');
  }
}

// Singleton
const electronSyncClient = new ElectronSyncClient();

export { electronSyncClient, ElectronSyncClient };

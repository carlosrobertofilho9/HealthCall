/**
 * Cliente de Sincronização de Rede
 * 
 * Este serviço gerencia a conexão com o servidor de sincronização HealthCall.
 * Funciona tanto no ambiente Electron quanto no navegador web.
 * 
 * Funcionalidades:
 * - Descoberta automática do servidor na rede local
 * - Reconexão automática em caso de desconexão
 * - Sincronização em tempo real via WebSocket
 * - Fallback para REST API quando WebSocket não disponível
 */

import type { Patient, Warning, CallRecord } from '@/types';

export interface SyncConfig {
  serverUrl: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onDataUpdate?: (data: DataUpdateEvent) => void;
  onError?: (error: Error) => void;
}

export interface DataUpdateEvent {
  type: 'connected' | 'pong' | 'data_update' | 'full_sync' | 'client_joined' | 'client_left';
  table?: string;
  action?: 'insert' | 'update' | 'delete' | 'clear';
  data?: unknown;
  timestamp: number;
  clients?: number;
}

export interface ServerStatus {
  success: boolean;
  server: string;
  version: string;
  clients: number;
  addresses: Array<{
    interface: string;
    address: string;
    url: string;
  }>;
  timestamp: number;
}

class NetworkSyncClient {
  private ws: WebSocket | null = null;
  private config: SyncConfig | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private isIntentionallyClosed = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  /**
   * Conecta ao servidor de sincronização
   */
  async connect(config: SyncConfig): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[SyncClient] Já conectado');
      return true;
    }

    if (this.isConnecting) {
      console.log('[SyncClient] Conexão em andamento...');
      return false;
    }

    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      ...config
    };

    this.isIntentionallyClosed = false;
    this.isConnecting = true;

    try {
      // Primeiro verifica se o servidor está acessível via REST
      const status = await this.getServerStatus();
      if (!status.success) {
        throw new Error('Servidor não acessível');
      }

      // Conecta via WebSocket
      const wsUrl = this.config.serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('Timeout ao conectar'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.log('[SyncClient] Conectado ao servidor');
          
          // Inicia ping para manter conexão viva
          this.startPing();
          
          this.config?.onConnect?.();
          this.emit('connected', { timestamp: Date.now() });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[SyncClient] Erro ao processar mensagem:', error);
          }
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.stopPing();
          console.log('[SyncClient] Desconectado');
          
          this.config?.onDisconnect?.();
          this.emit('disconnected', { timestamp: Date.now() });
          
          // Tenta reconectar automaticamente
          if (this.config?.autoReconnect && !this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('[SyncClient] Erro na conexão');
          this.config?.onError?.(new Error('Erro na conexão WebSocket'));
          reject(error);
        };
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('[SyncClient] Erro ao conectar:', error);
      
      // Tenta reconectar automaticamente
      if (this.config?.autoReconnect && !this.isIntentionallyClosed) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPing();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('[SyncClient] Desconectado intencionalmente');
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Agenda reconexão automática
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    const interval = this.config?.reconnectInterval || 5000;
    console.log(`[SyncClient] Tentando reconectar em ${interval}ms...`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.config && !this.isIntentionallyClosed) {
        await this.connect(this.config);
      }
    }, interval);
  }

  /**
   * Inicia ping para manter conexão viva
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Para o ping
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Processa mensagens recebidas do servidor
   */
  private handleMessage(data: DataUpdateEvent): void {
    switch (data.type) {
      case 'connected':
        console.log('[SyncClient] Mensagem de boas-vindas recebida');
        break;
      
      case 'pong':
        // Resposta ao ping - conexão está viva
        break;
      
      case 'data_update':
        console.log('[SyncClient] Atualização de dados:', data.table, data.action);
        this.config?.onDataUpdate?.(data);
        this.emit('data_update', data);
        break;
      
      case 'full_sync':
        console.log('[SyncClient] Sincronização completa recebida');
        this.emit('full_sync', data);
        break;
      
      case 'client_joined':
      case 'client_left':
        console.log(`[SyncClient] ${data.type} - Total de clientes: ${data.clients}`);
        this.emit('clients_changed', data);
        break;
      
      default:
        console.log('[SyncClient] Mensagem desconhecida:', data.type);
    }
  }

  /**
   * Solicita sincronização completa do servidor
   */
  requestFullSync(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'request_sync' }));
    }
  }

  // ============================================
  // Event Emitter simples
  // ============================================
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[SyncClient] Erro no listener ${event}:`, error);
      }
    });
  }

  // ============================================
  // REST API Methods
  // ============================================
  
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    if (!this.config?.serverUrl) {
      throw new Error('Servidor não configurado');
    }
    
    const url = `${this.config.serverUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido');
    }
    
    return data;
  }

  /**
   * Obtém status do servidor
   */
  async getServerStatus(): Promise<ServerStatus> {
    if (!this.config?.serverUrl) {
      throw new Error('Servidor não configurado');
    }
    
    const response = await fetch(`${this.config.serverUrl}/api/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    return response.json();
  }

  // ============================================
  // Pacientes
  // ============================================
  
  async getPatients(): Promise<Patient[]> {
    const result = await this.fetch<{ data: Patient[] }>('/api/patients');
    return result.data;
  }

  async getWaitingPatients(): Promise<Patient[]> {
    const result = await this.fetch<{ data: Patient[] }>('/api/patients/waiting');
    return result.data;
  }

  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const result = await this.fetch<{ data: Patient }>(`/api/patients/${id}`);
      return result.data;
    } catch {
      return null;
    }
  }

  async addPatient(name: string, destination: string): Promise<Patient> {
    const result = await this.fetch<{ data: Patient }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify({ name, destination }),
    });
    return result.data;
  }

  async addPatientByNumber(destination: string): Promise<Patient> {
    const result = await this.fetch<{ data: Patient }>('/api/patients/ficha', {
      method: 'POST',
      body: JSON.stringify({ destination }),
    });
    return result.data;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const result = await this.fetch<{ data: Patient }>(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return result.data;
  }

  async callPatient(id: string, destination: string): Promise<Patient> {
    const result = await this.fetch<{ data: Patient }>(`/api/patients/${id}/call`, {
      method: 'POST',
      body: JSON.stringify({ destination }),
    });
    return result.data;
  }

  async removePatient(id: string): Promise<boolean> {
    await this.fetch(`/api/patients/${id}`, { method: 'DELETE' });
    return true;
  }

  async clearQueue(): Promise<boolean> {
    await this.fetch('/api/patients', { method: 'DELETE' });
    return true;
  }

  // ============================================
  // Chamadas
  // ============================================
  
  async getLastCall(): Promise<{ patient: Patient; location: string } | null> {
    const result = await this.fetch<{ data: { patient: Patient; location: string } | null }>('/api/calls/last');
    return result.data;
  }

  async getCallHistory(limit = 10): Promise<CallRecord[]> {
    const result = await this.fetch<{ data: CallRecord[] }>(`/api/calls/history?limit=${limit}`);
    return result.data;
  }

  // ============================================
  // Avisos
  // ============================================
  
  async getWarnings(): Promise<Warning[]> {
    const result = await this.fetch<{ data: Warning[] }>('/api/warnings');
    return result.data;
  }

  async getActiveWarnings(): Promise<Warning[]> {
    const result = await this.fetch<{ data: Warning[] }>('/api/warnings/active');
    return result.data;
  }

  async getWarningById(id: string): Promise<Warning | null> {
    try {
      const result = await this.fetch<{ data: Warning }>(`/api/warnings/${id}`);
      return result.data;
    } catch {
      return null;
    }
  }

  async addWarning(warning: Partial<Warning>): Promise<Warning> {
    const result = await this.fetch<{ data: Warning }>('/api/warnings', {
      method: 'POST',
      body: JSON.stringify(warning),
    });
    return result.data;
  }

  async updateWarning(id: string, updates: Partial<Warning>): Promise<Warning> {
    const result = await this.fetch<{ data: Warning }>(`/api/warnings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return result.data;
  }

  async removeWarning(id: string): Promise<boolean> {
    await this.fetch(`/api/warnings/${id}`, { method: 'DELETE' });
    return true;
  }

  // ============================================
  // Destinos
  // ============================================
  
  async getDestinations(): Promise<string[]> {
    const result = await this.fetch<{ data: string[] }>('/api/destinations');
    return result.data;
  }

  // ============================================
  // Configurações
  // ============================================
  
  async getSettings(): Promise<Record<string, unknown>> {
    const result = await this.fetch<{ data: Record<string, unknown> }>('/api/settings');
    return result.data;
  }

  async getSetting(key: string): Promise<unknown> {
    const result = await this.fetch<{ data: { value: unknown } }>(`/api/settings/${key}`);
    return result.data.value;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.fetch(`/api/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }
}

// Exporta uma instância singleton
export const syncClient = new NetworkSyncClient();

// Exporta também a classe para casos especiais
export { NetworkSyncClient };

/**
 * Tenta descobrir automaticamente um servidor HealthCall na rede local
 * Testa uma lista de IPs comuns
 */
export async function discoverServer(timeout = 3000): Promise<string | null> {
  // 1. Tenta usar descoberta nativa via Electron (Muito mais rápido e preciso)
  if (typeof window !== 'undefined' && window.electron?.sync?.discoverServers) {
    console.log('[Discovery] Usando descoberta nativa Electron...');
    try {
      const result = await window.electron.sync.discoverServers();
      if (result.success && result.servers && result.servers.length > 0) {
        console.log('[Discovery] Servidores encontrados via Electron:', result.servers);
        return result.servers[0];
      }
    } catch (e) {
      console.warn('[Discovery] Falha na descoberta Electron, tentando fallback web...', e);
    }
  }

  // 2. Fallback: Varredura manual via browser (Limitada)
  console.log('[Discovery] Iniciando varredura via Browser...');
  
  // Lista de IPs a tentar
  const ipsToTry = [
    'localhost:3457',
    '127.0.0.1:3457',
  ];
  
  // Adiciona IPs comuns de rede local (Aumentado limite para 254)
  for (let i = 1; i <= 254; i++) {
    ipsToTry.push(`192.168.1.${i}:3457`);
    ipsToTry.push(`192.168.0.${i}:3457`);
    ipsToTry.push(`10.0.0.${i}:3457`);
  }

  // Tenta em paralelo (Aumentado batch e total)
  const batchSize = 30;
  const maxScan = 150; // Aumentado de 50 para 150 tentativas no browser
  
  for (let i = 0; i < Math.min(maxScan, ipsToTry.length); i += batchSize) {
    const batch = ipsToTry.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(async (ip) => {
        const url = `http://${ip}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout); // Timeout por request
        
        try {
          const response = await fetch(`${url}/api/status`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          
          if (response.ok) {
            const data = await response.json();
            if (data.server === 'HealthCall Sync Server') {
              return url;
            }
          }
        } catch {
          // Ignora erros
        }
        clearTimeout(timer);
        throw new Error('Não encontrado');
      })
    );
    
    // Retorna o primeiro servidor encontrado
    for (const result of results) {
      if (result.status === 'fulfilled') {
        console.log('[Discovery] Servidor encontrado via Web:', result.value);
        return result.value;
      }
    }
  }
  
  return null;
}

export default syncClient;

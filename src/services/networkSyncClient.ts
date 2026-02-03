/**
 * Cliente de Sincronização (Compatibility Wrapper)
 * 
 * Este serviço agora é um wrapper para o serviço de banco de dados (Supabase),
 * mantendo a interface original para compatibilidade.
 */

import type { Patient, Warning, CallRecord } from '@/types';
import db, { onDataUpdate } from '@/services/localDatabase';

export interface SyncConfig {
  serverUrl?: string;
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
  private config: SyncConfig | null = null;
  private _isConnected = false;

  /**
   * Conecta ao servidor (Supabase via database service)
   */
  async connect(config: SyncConfig): Promise<boolean> {
    this.config = config;
    this._isConnected = true;
    
    // Simula conexão
    setTimeout(() => {
      this.config?.onConnect?.();
      this.emit('connected', { timestamp: Date.now() });
    }, 100);

    // Conecta listeners do Realtime
    onDataUpdate((data) => {
      const event: DataUpdateEvent = {
        type: 'data_update',
        table: data.table,
        timestamp: Date.now(),
        action: 'update'
      };
      this.config?.onDataUpdate?.(event);
      this.emit('data_update', event);
    });

    return true;
  }

  /**
   * Desconecta
   */
  disconnect(): void {
    this._isConnected = false;
    this.config?.onDisconnect?.();
    this.emit('disconnected', { timestamp: Date.now() });
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  requestFullSync(): void {
    this.emit('full_sync', { timestamp: Date.now() });
  }

  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

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

  // DATA METHODS
  async getPatients(): Promise<Patient[]> { return db.getPatients(); }
  async getWaitingPatients(): Promise<Patient[]> { return db.getWaitingPatients(); }
  async getPatientById(id: string): Promise<Patient | null> { return db.getPatientById(id); }
  async addPatient(name: string, destination: string): Promise<Patient | null> { return db.addPatient(name, destination); }
  async addPatientByNumber(destination: string): Promise<Patient | null> { return db.addPatientByNumber(destination); }
  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    const current = await db.getPatientById(id);
    if (!current) throw new Error('Patient not found');
    return db.updatePatient({ ...current, ...updates });
  }
  async callPatient(id: string, destination: string): Promise<Patient | null> { return db.callPatient(id, destination); }
  async removePatient(id: string): Promise<boolean> { return db.removePatient(id); }
  async clearQueue(): Promise<boolean> { return db.clearQueue(); }
  async getLastCall(): Promise<{ patient: Patient; location: string } | null> { return db.getLastCall(); }
  async getCallHistory(limit = 10): Promise<CallRecord[]> { return db.getCallHistory(limit); }
  async getWarnings(): Promise<Warning[]> { return db.getWarnings(); }
  async getActiveWarnings(): Promise<Warning[]> { return db.getActiveWarnings(); }
  async getWarningById(id: string): Promise<Warning | null> { return db.getWarningById(id); }
  async addWarning(warning: Partial<Warning>): Promise<Warning | null> { return db.addWarning(warning as any); }
  async updateWarning(id: string, updates: Partial<Warning>): Promise<Warning | null> { return db.updateWarning(id, updates); }
  async removeWarning(id: string): Promise<boolean> { return db.removeWarning(id); }
  async getDestinations(): Promise<string[]> { return db.getUniqueDestinations(); }
  async getSettings(): Promise<Record<string, string>> { return db.getAllSettings(); }
  async getSetting(key: string): Promise<string | null> { return db.getSetting(key); }
  async setSetting(key: string, value: string | number | boolean): Promise<void> { return db.setSetting(key, value); }
  
  getServerUrl(): string | null { return null; }
  async getServerStatus(): Promise<ServerStatus> {
    return {
      success: true,
      server: 'Supabase Cloud',
      version: '1.0',
      clients: 1,
      addresses: [],
      timestamp: Date.now()
    };
  }
}

export const syncClient = new NetworkSyncClient();
export { NetworkSyncClient };
export async function discoverServer(): Promise<string | null> { return null; }
export default syncClient;
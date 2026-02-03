/**
 * Hook useNetworkSync (Supabase Edition)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { syncClient, type DataUpdateEvent, type ServerStatus } from '@/services/networkSyncClient';
import type { Patient, Warning, CallRecord } from '@/types';
import { toast } from 'sonner';
import { SUPABASE_TABLES } from '@/constants';

export interface NetworkSyncState {
  isConnected: boolean;
  isConnecting: boolean;
  serverUrl: string | null;
  serverInfo: ServerStatus | null;
  connectedClients: number;
  patients: Patient[];
  warnings: Warning[];
  callHistory: CallRecord[];
  lastCall: { patient: Patient; location: string } | null;
  connect: (serverUrl: string) => Promise<boolean>;
  disconnect: () => void;
  discoverAndConnect: () => Promise<boolean>;
  addPatient: (name: string, destination: string) => Promise<Patient | null>;
  addPatientByNumber: (destination: string) => Promise<Patient | null>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<Patient | null>;
  callPatient: (id: string, destination: string) => Promise<Patient | null>;
  removePatient: (id: string) => Promise<boolean>;
  clearQueue: () => Promise<boolean>;
  getWarnings: () => Promise<Warning[]>;
  getActiveWarnings: () => Promise<Warning[]>;
  getCallHistory: () => Promise<CallRecord[]>;
  getLastCall: () => Promise<{ patient: Patient; location: string } | null>;
  refresh: () => Promise<void>;
}

export function useNetworkSync(): NetworkSyncState {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [lastCall, setLastCall] = useState<{ patient: Patient; location: string } | null>(null);
  const isInitialized = useRef(false);

  const loadAllData = useCallback(async () => {
    try {
      const [p, w, h, l] = await Promise.all([
        syncClient.getPatients(),
        syncClient.getActiveWarnings(),
        syncClient.getCallHistory(),
        syncClient.getLastCall(),
      ]);
      setPatients(p);
      setWarnings(w);
      setCallHistory(h);
      setLastCall(l);
    } catch (error) {
      console.error('[useNetworkSync] Error:', error);
    }
  }, []);

  const handleDataUpdate = useCallback((event: DataUpdateEvent) => {
    if (event.table === SUPABASE_TABLES.PATIENTS) {
        syncClient.getPatients().then(setPatients).catch(console.error);
        syncClient.getLastCall().then(setLastCall).catch(console.error);
    } else if (event.table === SUPABASE_TABLES.WARNINGS) {
        syncClient.getActiveWarnings().then(setWarnings).catch(console.error);
    } else if (event.table === SUPABASE_TABLES.CALLS) {
        syncClient.getCallHistory().then(setCallHistory).catch(console.error);
    } else {
        loadAllData();
    }
  }, [loadAllData]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    syncClient.connect({ serverUrl: 'supabase' });
    loadAllData();
    syncClient.on('data_update', handleDataUpdate);
    return () => {
      syncClient.off('data_update', handleDataUpdate);
    };
  }, [handleDataUpdate, loadAllData]);

  return {
    isConnected, isConnecting, serverUrl: 'Supabase', serverInfo: null, connectedClients: 1,
    patients, warnings, callHistory, lastCall,
    connect: async () => true, disconnect: () => {}, discoverAndConnect: async () => true,
    addPatient: (n, d) => syncClient.addPatient(n, d),
    addPatientByNumber: (d) => syncClient.addPatientByNumber(d),
    updatePatient: (id, u) => syncClient.updatePatient(id, u),
    callPatient: (id, d) => syncClient.callPatient(id, d),
    removePatient: (id) => syncClient.removePatient(id),
    clearQueue: () => syncClient.clearQueue(),
    getWarnings: () => syncClient.getWarnings(),
    getActiveWarnings: () => syncClient.getActiveWarnings(),
    getCallHistory: () => syncClient.getCallHistory(),
    getLastCall: () => syncClient.getLastCall(),
    refresh: loadAllData,
  };
}

export default useNetworkSync;
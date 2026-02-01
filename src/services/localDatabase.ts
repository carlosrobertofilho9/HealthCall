/**
 * Serviço de Banco de Dados Local
 * Encapsula as chamadas IPC para o banco SQLite do Electron
 */

import { Patient, Warning, CallRecord } from '@/types';

// Tipos para respostas do IPC
interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Verifica se está rodando no Electron
function isElectron(): boolean {
  return typeof window !== 'undefined' && 'electron' in window;
}

// Helper para garantir que window.electron existe
function getElectronAPI() {
  if (!isElectron()) {
    throw new Error('Este recurso só está disponível no aplicativo Electron');
  }
  return (window as any).electron;
}

// ============================================
// PATIENTS
// ============================================

export async function getPatients(): Promise<Patient[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient[]> = await electron.db.patients.list();
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient | null> = await electron.db.patients.get(id);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function addPatient(name: string, destination: string): Promise<Patient | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient> = await electron.db.patients.add(name, destination);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function addPatientByNumber(destination: string): Promise<Patient | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient> = await electron.db.patients.addByNumber(destination);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function updatePatient(patient: Patient): Promise<Patient | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient> = await electron.db.patients.update(patient.id, patient);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function callPatient(id: string, destination: string): Promise<Patient | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient> = await electron.db.patients.call(id, destination);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function removePatient(id: string): Promise<boolean> {
  const electron = getElectronAPI();
  const response: IPCResponse<void> = await electron.db.patients.remove(id);
  return response.success;
}

export async function clearQueue(): Promise<boolean> {
  const electron = getElectronAPI();
  const response: IPCResponse<void> = await electron.db.patients.clearAll();
  return response.success;
}

export async function getWaitingPatients(): Promise<Patient[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient[]> = await electron.db.patients.getWaiting();
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

export async function getLastCalledPatient(): Promise<Patient | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Patient | null> = await electron.db.patients.getLastCalled();
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function getCallHistory(limit = 10): Promise<CallRecord[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<CallRecord[]> = await electron.db.patients.getCallHistory(limit);
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

export async function getLastCall(): Promise<{ patient: Patient; location: string } | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<{ patient: Patient; location: string } | null> = 
    await electron.db.patients.getLastCall();
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function getUniqueDestinations(): Promise<string[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<string[]> = await electron.db.patients.getDestinations();
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

export async function getNextFichaNumber(): Promise<number> {
  const electron = getElectronAPI();
  const response: IPCResponse<number> = await electron.db.patients.getNextFichaNumber();
  if (!response.success) throw new Error(response.error);
  return response.data || 1;
}

// ============================================
// WARNINGS
// ============================================

export async function getWarnings(): Promise<Warning[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning[]> = await electron.db.warnings.list();
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

export async function getActiveWarnings(): Promise<Warning[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning[]> = await electron.db.warnings.listActive();
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

export async function getWarningById(id: string): Promise<Warning | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning | null> = await electron.db.warnings.get(id);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function addWarning(warning: Omit<Warning, 'id' | 'created_at'>): Promise<Warning | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning> = await electron.db.warnings.add(warning);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function updateWarning(id: string, updates: Partial<Warning>): Promise<Warning | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning> = await electron.db.warnings.update(id, updates);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function removeWarning(id: string): Promise<boolean> {
  const electron = getElectronAPI();
  const response: IPCResponse<void> = await electron.db.warnings.remove(id);
  return response.success;
}

export async function toggleWarningActive(id: string): Promise<Warning | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning> = await electron.db.warnings.toggle(id);
  if (!response.success) throw new Error(response.error);
  return response.data || null;
}

export async function reorderWarnings(orderedIds: string[]): Promise<Warning[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<Warning[]> = await electron.db.warnings.reorder(orderedIds);
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

/**
 * Salva um arquivo de mídia localmente
 * @param file - Arquivo a ser salvo
 * @returns URL local do arquivo salvo
 */
export async function saveWarningMedia(file: File): Promise<string> {
  const electron = getElectronAPI();
  
  // Converte o File para ArrayBuffer e depois para array de bytes
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Array.from(new Uint8Array(arrayBuffer));
  
  const response: IPCResponse<string> = await electron.db.warnings.saveMedia(buffer, file.name);
  if (!response.success) throw new Error(response.error);
  return response.data || '';
}

/**
 * Obtém o caminho absoluto de um arquivo de mídia local
 */
export async function getWarningMediaPath(localUrl: string): Promise<string> {
  const electron = getElectronAPI();
  const response: IPCResponse<string> = await electron.db.warnings.getMediaPath(localUrl);
  if (!response.success) throw new Error(response.error);
  return response.data || localUrl;
}

// ============================================
// SETTINGS
// ============================================

export async function getSetting(key: string): Promise<string | null> {
  const electron = getElectronAPI();
  const response: IPCResponse<string | null> = await electron.db.settings.get(key);
  if (!response.success) throw new Error(response.error);
  return response.data ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const electron = getElectronAPI();
  const response: IPCResponse<Record<string, string>> = await electron.db.settings.getAll();
  if (!response.success) throw new Error(response.error);
  return response.data || {};
}

export async function setSetting(key: string, value: string | boolean | number, description?: string): Promise<void> {
  const electron = getElectronAPI();
  // Converte o valor para string se não for
  const stringValue = typeof value === 'string' ? value : String(value);
  const response: IPCResponse<void> = await electron.db.settings.set(key, stringValue, description);
  if (!response.success) throw new Error(response.error);
}

export async function setMultipleSettings(settings: Record<string, string>): Promise<Record<string, string>> {
  const electron = getElectronAPI();
  const response: IPCResponse<Record<string, string>> = await electron.db.settings.setMultiple(settings);
  if (!response.success) throw new Error(response.error);
  return response.data || {};
}

// ============================================
// RSS FEED
// ============================================

export interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string | null;
}

export async function fetchRssFeed(url?: string): Promise<RssItem[]> {
  const electron = getElectronAPI();
  const response: IPCResponse<RssItem[]> = await electron.rss.fetch(url);
  if (!response.success) throw new Error(response.error);
  return response.data || [];
}

// ============================================
// REALTIME / LISTENERS
// ============================================

export type DataUpdateCallback = (data: { table: string }) => void;

/**
 * Registra um listener para atualizações de dados
 */
export function onDataUpdate(callback: DataUpdateCallback): void {
  if (!isElectron()) return;
  const electron = getElectronAPI();
  electron.on('data:updated', callback);
}

/**
 * Remove um listener de atualizações de dados
 */
export function offDataUpdate(callback: DataUpdateCallback): void {
  if (!isElectron()) return;
  const electron = getElectronAPI();
  electron.off('data:updated', callback);
}

// Export default com todos os métodos
export default {
  // Patients
  getPatients,
  getPatientById,
  addPatient,
  addPatientByNumber,
  updatePatient,
  callPatient,
  removePatient,
  clearQueue,
  getWaitingPatients,
  getLastCalledPatient,
  getCallHistory,
  getLastCall,
  getUniqueDestinations,
  getNextFichaNumber,
  
  // Warnings
  getWarnings,
  getActiveWarnings,
  getWarningById,
  addWarning,
  updateWarning,
  removeWarning,
  toggleWarningActive,
  reorderWarnings,
  saveWarningMedia,
  getWarningMediaPath,
  
  // Settings
  getSetting,
  getAllSettings,
  setSetting,
  setMultipleSettings,
  
  // RSS
  fetchRssFeed,
  
  // Realtime
  onDataUpdate,
  offDataUpdate,
};

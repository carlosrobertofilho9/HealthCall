import { useEffect, useState } from 'react';

/**
 * Hook para detectar e usar APIs do Electron
 * Funciona tanto no browser (PWA) quanto no Electron desktop
 */

// Definir tipos globais para o window.electron
declare global {
  interface Window {
    electron?: {
      notification: {
        send: (title: string, body: string, data?: any) => Promise<{ success: boolean; error?: string }>;
      };
      window: {
        setAlwaysOnTop: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean }>;
        minimizeToTray: () => Promise<{ success: boolean }>;
        openDisplayWindow: () => Promise<{ success: boolean }>;
      };
      tray: {
        updateBadge: (count: number) => Promise<{ success: boolean }>;
      };
      autoLaunch: {
        isEnabled: () => Promise<boolean>;
        setEnabled: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean }>;
      };
      tts: {
        generate: (text: string) => Promise<string | null>;
      };
      sync: {
        getMode: () => Promise<{ mode: 'server' | 'client' | 'standalone' | null; serverInfo: any }>;
        discoverServers: () => Promise<Array<{
          found: boolean;
          ip: string;
          port: number;
          url: string;
          wsUrl: string;
          version?: string;
          clients?: number;
        }>>;
        connectToServer: (serverUrl: string) => Promise<{ success: boolean; server?: any; error?: string }>;
        forceServerMode: () => Promise<{ success: boolean; serverInfo?: any; error?: string }>;
        getServerInfo: () => Promise<{
          port: number;
          addresses: Array<{ interface: string; address: string }>;
          clients?: number;
        } | null>;
      };
      on: (channel: string, callback: (...args: any[]) => void) => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [alwaysOnTop, setAlwaysOnTopState] = useState(false);
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);

  useEffect(() => {
    // Detectar se está rodando no Electron
    setIsElectron(typeof window.electron !== 'undefined');

    // Carregar configuração de auto-launch
    if (window.electron) {
      window.electron.autoLaunch.isEnabled().then(setAutoLaunchEnabled);
    }
  }, []);

  /**
   * Enviar notificação nativa do Windows
   */
  const sendNotification = async (
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> => {
    if (!isElectron || !window.electron) {
      // Fallback para Web Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
        return true;
      }
      return false;
    }

    try {
      const result = await window.electron.notification.send(title, body, data);
      return result.success;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  };

  /**
   * Manter janela sempre visível (always on top)
   */
  const setAlwaysOnTop = async (enabled: boolean): Promise<boolean> => {
    if (!isElectron || !window.electron) return false;

    try {
      const result = await window.electron.window.setAlwaysOnTop(enabled);
      if (result.success) {
        setAlwaysOnTopState(enabled);
      }
      return result.success;
    } catch (error) {
      console.error('Erro ao configurar always on top:', error);
      return false;
    }
  };

  /**
   * Minimizar para bandeja do sistema
   */
  const minimizeToTray = async (): Promise<boolean> => {
    if (!isElectron || !window.electron) return false;

    try {
      const result = await window.electron.window.minimizeToTray();
      return result.success;
    } catch (error) {
      console.error('Erro ao minimizar para tray:', error);
      return false;
    }
  };

  /**
   * Abrir janela de Display separada
   */
  const openDisplayWindow = async (): Promise<boolean> => {
    if (!isElectron || !window.electron) return false;

    try {
      const result = await window.electron.window.openDisplayWindow();
      return result.success;
    } catch (error) {
      console.error('Erro ao abrir janela de display:', error);
      return false;
    }
  };

  /**
   * Atualizar badge de contador na bandeja
   */
  const updateBadge = async (count: number): Promise<boolean> => {
    if (!isElectron || !window.electron) return false;

    try {
      const result = await window.electron.tray.updateBadge(count);
      return result.success;
    } catch (error) {
      console.error('Erro ao atualizar badge:', error);
      return false;
    }
  };

  const setAutoLaunch = async (enabled: boolean): Promise<boolean> => {
    if (!isElectron || !window.electron) return false;

    try {
      const result = await window.electron.autoLaunch.setEnabled(enabled);
      if (result.success) {
        setAutoLaunchEnabled(enabled);
      }
      return result.success;
    } catch (error) {
      console.error('Erro ao configurar auto-launch:', error);
      return false;
    }
  };

  /**
   * Gerar áudio TTS via Google Cloud (Electron)
   */
  const generateTTS = async (text: string): Promise<string | null> => {
    if (!isElectron || !window.electron?.tts) return null;
    return window.electron.tts.generate(text);
  };

  /**
   * Registrar listener para eventos do Electron
   */
  const onElectronEvent = (
    channel: string,
    callback: (...args: any[]) => void
  ) => {
    if (isElectron && window.electron) {
      window.electron.on(channel, callback);
    }
  };

  /**
   * Remover listener de eventos do Electron
   */
  const offElectronEvent = (
    channel: string,
    callback: (...args: any[]) => void
  ) => {
    if (isElectron && window.electron) {
      window.electron.off(channel, callback);
    }
  };

  return {
    isElectron,
    alwaysOnTop,
    autoLaunchEnabled,
    sendNotification,
    setAlwaysOnTop,
    minimizeToTray,
    openDisplayWindow,
    updateBadge,
    setAutoLaunch,
    onElectronEvent,
    offElectronEvent,
    generateTTS,
  };
}

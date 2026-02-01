const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script que expõe APIs do Electron de forma segura para o React
 * Via contextBridge, sem expor todo o Node.js
 */

contextBridge.exposeInMainWorld('electron', {
  // Notificações nativas
  notification: {
    send: (title, body, data) => 
      ipcRenderer.invoke('send-notification', { title, body, data }),
  },

  // Controle de janela
  window: {
    setAlwaysOnTop: (enabled) => 
      ipcRenderer.invoke('set-always-on-top', enabled),
    minimizeToTray: () => 
      ipcRenderer.invoke('minimize-to-tray'),
    openDisplayWindow: () =>
      ipcRenderer.invoke('open-display-window'),
  },

  // System tray
  tray: {
    updateBadge: (count) => 
      ipcRenderer.invoke('update-badge', count),
  },

  // Auto-launch
  autoLaunch: {
    isEnabled: () => 
      ipcRenderer.invoke('get-auto-launch-enabled'),
    setEnabled: (enabled) => 
      ipcRenderer.invoke('set-auto-launch', enabled),
  },

  // TTS Generation
  tts: {
    generate: (text) => 
      ipcRenderer.invoke('generate-tts', text),
  },

  // Listeners para eventos do main process
  on: (channel, callback) => {
    const validChannels = ['notification-clicked', 'navigate-to'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remover listeners
  off: (channel, callback) => {
    const validChannels = ['notification-clicked', 'navigate-to'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});

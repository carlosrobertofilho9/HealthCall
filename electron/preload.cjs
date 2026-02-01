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

  // ============================================
  // Database API (Local SQLite)
  // ============================================
  db: {
    // Patients
    patients: {
      list: () => ipcRenderer.invoke('db:patient:list'),
      get: (id) => ipcRenderer.invoke('db:patient:get', id),
      add: (name, destination) => ipcRenderer.invoke('db:patient:add', { name, destination }),
      addByNumber: (destination) => ipcRenderer.invoke('db:patient:addByNumber', { destination }),
      update: (id, updates) => ipcRenderer.invoke('db:patient:update', { id, updates }),
      call: (id, destination) => ipcRenderer.invoke('db:patient:call', { id, destination }),
      remove: (id) => ipcRenderer.invoke('db:patient:remove', id),
      clearAll: () => ipcRenderer.invoke('db:patient:clearAll'),
      getWaiting: () => ipcRenderer.invoke('db:patient:getWaiting'),
      getLastCalled: () => ipcRenderer.invoke('db:patient:getLastCalled'),
      getCallHistory: (limit) => ipcRenderer.invoke('db:patient:getCallHistory', limit),
      getLastCall: () => ipcRenderer.invoke('db:patient:getLastCall'),
      getDestinations: () => ipcRenderer.invoke('db:patient:getDestinations'),
      getNextFichaNumber: () => ipcRenderer.invoke('db:patient:getNextFichaNumber'),
    },
    
    // Warnings
    warnings: {
      list: () => ipcRenderer.invoke('db:warning:list'),
      listActive: () => ipcRenderer.invoke('db:warning:listActive'),
      get: (id) => ipcRenderer.invoke('db:warning:get', id),
      add: (warning) => ipcRenderer.invoke('db:warning:add', warning),
      update: (id, updates) => ipcRenderer.invoke('db:warning:update', { id, updates }),
      remove: (id) => ipcRenderer.invoke('db:warning:remove', id),
      toggle: (id) => ipcRenderer.invoke('db:warning:toggle', id),
      reorder: (orderedIds) => ipcRenderer.invoke('db:warning:reorder', orderedIds),
      saveMedia: (buffer, filename) => ipcRenderer.invoke('db:warning:saveMedia', { buffer, filename }),
      getMediaPath: (localUrl) => ipcRenderer.invoke('db:warning:getMediaPath', localUrl),
    },
    
    // Settings
    settings: {
      get: (key) => ipcRenderer.invoke('db:settings:get', key),
      getAll: () => ipcRenderer.invoke('db:settings:getAll'),
      set: (key, value, description) => ipcRenderer.invoke('db:settings:set', { key, value, description }),
      setMultiple: (settings) => ipcRenderer.invoke('db:settings:setMultiple', settings),
    },
  },

  // RSS Feed
  rss: {
    fetch: (url) => ipcRenderer.invoke('rss:fetch', url),
  },

  // ============================================
  // Authentication API (Local)
  // ============================================
  auth: {
    login: (email, password) => ipcRenderer.invoke('auth:login', { email, password }),
    updateCredentials: (userId, email, password, name) => 
      ipcRenderer.invoke('auth:updateCredentials', { userId, email, password, name }),
    getUser: (userId) => ipcRenderer.invoke('auth:getUser', userId),
    isFirstLogin: (userId) => ipcRenderer.invoke('auth:isFirstLogin', userId),
    updateDestination: (userId, destination) => 
      ipcRenderer.invoke('auth:updateDestination', { userId, destination }),
  },

  // Listeners para eventos do main process
  on: (channel, callback) => {
    const validChannels = ['notification-clicked', 'navigate-to', 'data:updated'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  // Remover listeners
  off: (channel, callback) => {
    const validChannels = ['notification-clicked', 'navigate-to', 'data:updated'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});

import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import AutoLaunch from 'auto-launch';
import { initializeTTS, generateSpeech } from './services/ttsService.js';
import { startAudioServer, getAudioUrl } from './services/audioServer.js';
import { fetchRssFeed } from './services/rssService.js';
import { 
    initDatabase, 
    closeDatabase,
    patientsRepo, 
    warningsRepo, 
    settingsRepo,
    authRepo
} from './database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar serviços de áudio
initializeTTS();
startAudioServer();

const isDev = !app.isPackaged;

let mainWindow = null;
let displayWindows = []; // Array para múltiplas janelas de display
let tray = null;
let isQuitting = false;

// Configurar auto-launch (opcional, pode ser habilitado via settings)
const healthCallAutoLauncher = new AutoLaunch({
  name: 'HealthCall',
  path: app.getPath('exe'),
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/healthcall-icon.png'),
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Iniciar maximizado para displays
    show: false,
  });

  // Carregar app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Minimizar para tray ao invés de fechar
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Listener para abrir janela de display
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.addEventListener('electron-open-display', () => {
        if (window.electron) {
          // Enviar IPC para main process
          const { ipcRenderer } = require('electron');
        }
      });
    `);
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/healthcall-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  tray.setToolTip('HealthCall');

  updateTrayMenu(0); // Iniciar sem chamadas pendentes

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function updateTrayMenu(pendingCallsCount = 0) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `🔔 Chamadas Pendentes (${pendingCallsCount})`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '📺 Abrir Display',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '⚙️ Configurações',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to', '/settings');
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌ Sair',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Atualizar badge (título do tray)
  if (pendingCallsCount > 0) {
    tray.setTitle(`(${pendingCallsCount})`);
  } else {
    tray.setTitle('');
  }
}

// IPC Handlers
ipcMain.handle('send-notification', async (event, { title, body, data }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, '../public/healthcall-icon.png'),
      silent: false,
    });

    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        // Enviar dados da notificação para o React
        if (data) {
          mainWindow.webContents.send('notification-clicked', data);
        }
      }
    });

    notification.show();
    return { success: true };
  }
  return { success: false, error: 'Notifications not supported' };
});

ipcMain.handle('set-always-on-top', async (event, enabled) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enabled);
    return { success: true, enabled };
  }
  return { success: false };
});

ipcMain.handle('minimize-to-tray', async () => {
  if (mainWindow) {
    mainWindow.hide();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('update-badge', async (event, count) => {
  updateTrayMenu(count);
  return { success: true };
});

ipcMain.handle('get-auto-launch-enabled', async () => {
  return await healthCallAutoLauncher.isEnabled();
});

ipcMain.handle('set-auto-launch', async (event, enabled) => {
  try {
    if (enabled) {
      await healthCallAutoLauncher.enable();
    } else {
      await healthCallAutoLauncher.disable();
    }
    return { success: true, enabled };
  } catch (error) {
    console.error('Error setting auto-launch:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler para abrir nova janela de display
ipcMain.handle('open-display-window', async () => {
  const displayWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, '../public/healthcall-icon.png'),
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    displayWindow.loadURL('http://localhost:5173/display');
  } else {
    displayWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'display',
    });
  }

  displayWindow.maximize();
  displayWindow.show();

  displayWindow.on('closed', () => {
    const index = displayWindows.indexOf(displayWindow);
    if (index > -1) {
      displayWindows.splice(index, 1);
    }
  });

  displayWindows.push(displayWindow);
  return { success: true };
});

ipcMain.handle('generate-tts', async (event, text) => {
  try {
    const filename = await generateSpeech(text);
    return getAudioUrl(filename);
  } catch (error) {
    console.error('Error handling generate-tts:', error);
    return null;
  }
});

// ============================================
// IPC Handlers para Banco de Dados Local
// ============================================

// Helper para notificar todas as janelas sobre mudanças
function broadcastUpdate(table) {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('data:updated', { table });
  });
}

// --- PATIENTS ---
ipcMain.handle('db:patient:list', async () => {
  try {
    return { success: true, data: patientsRepo.listPatients() };
  } catch (error) {
    console.error('[IPC] Error listing patients:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:get', async (event, id) => {
  try {
    return { success: true, data: patientsRepo.getPatientById(id) };
  } catch (error) {
    console.error('[IPC] Error getting patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:add', async (event, { name, destination }) => {
  try {
    const patient = patientsRepo.addPatient({ name, destination });
    broadcastUpdate('patients');
    return { success: true, data: patient };
  } catch (error) {
    console.error('[IPC] Error adding patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:addByNumber', async (event, { destination }) => {
  try {
    const patient = patientsRepo.addPatientByNumber(destination);
    broadcastUpdate('patients');
    return { success: true, data: patient };
  } catch (error) {
    console.error('[IPC] Error adding patient by number:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:update', async (event, { id, updates }) => {
  try {
    const patient = patientsRepo.updatePatient(id, updates);
    broadcastUpdate('patients');
    return { success: true, data: patient };
  } catch (error) {
    console.error('[IPC] Error updating patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:call', async (event, { id, destination }) => {
  try {
    const patient = patientsRepo.callPatient(id, destination);
    broadcastUpdate('patients');
    broadcastUpdate('calls');
    return { success: true, data: patient };
  } catch (error) {
    console.error('[IPC] Error calling patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:remove', async (event, id) => {
  try {
    const success = patientsRepo.removePatient(id);
    broadcastUpdate('patients');
    return { success };
  } catch (error) {
    console.error('[IPC] Error removing patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:clearAll', async () => {
  try {
    patientsRepo.clearAllPatients();
    broadcastUpdate('patients');
    broadcastUpdate('calls');
    return { success: true };
  } catch (error) {
    console.error('[IPC] Error clearing patients:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getWaiting', async () => {
  try {
    return { success: true, data: patientsRepo.getWaitingPatients() };
  } catch (error) {
    console.error('[IPC] Error getting waiting patients:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getLastCalled', async () => {
  try {
    return { success: true, data: patientsRepo.getLastCalledPatient() };
  } catch (error) {
    console.error('[IPC] Error getting last called patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getCallHistory', async (event, limit = 10) => {
  try {
    return { success: true, data: patientsRepo.getCallHistory(limit) };
  } catch (error) {
    console.error('[IPC] Error getting call history:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getLastCall', async () => {
  try {
    return { success: true, data: patientsRepo.getLastCall() };
  } catch (error) {
    console.error('[IPC] Error getting last call:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getDestinations', async () => {
  try {
    return { success: true, data: patientsRepo.getUniqueDestinations() };
  } catch (error) {
    console.error('[IPC] Error getting destinations:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getNextFichaNumber', async () => {
  try {
    return { success: true, data: patientsRepo.getNextFichaNumber() };
  } catch (error) {
    console.error('[IPC] Error getting next ficha number:', error);
    return { success: false, error: error.message };
  }
});

// --- WARNINGS ---
ipcMain.handle('db:warning:list', async () => {
  try {
    return { success: true, data: warningsRepo.listWarnings() };
  } catch (error) {
    console.error('[IPC] Error listing warnings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:listActive', async () => {
  try {
    return { success: true, data: warningsRepo.listActiveWarnings() };
  } catch (error) {
    console.error('[IPC] Error listing active warnings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:get', async (event, id) => {
  try {
    return { success: true, data: warningsRepo.getWarningById(id) };
  } catch (error) {
    console.error('[IPC] Error getting warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:add', async (event, warning) => {
  try {
    const newWarning = warningsRepo.addWarning(warning);
    broadcastUpdate('warnings');
    return { success: true, data: newWarning };
  } catch (error) {
    console.error('[IPC] Error adding warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:update', async (event, { id, updates }) => {
  try {
    const warning = warningsRepo.updateWarning(id, updates);
    broadcastUpdate('warnings');
    return { success: true, data: warning };
  } catch (error) {
    console.error('[IPC] Error updating warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:remove', async (event, id) => {
  try {
    const success = warningsRepo.removeWarning(id);
    broadcastUpdate('warnings');
    return { success };
  } catch (error) {
    console.error('[IPC] Error removing warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:toggle', async (event, id) => {
  try {
    const warning = warningsRepo.toggleWarningActive(id);
    broadcastUpdate('warnings');
    return { success: true, data: warning };
  } catch (error) {
    console.error('[IPC] Error toggling warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:reorder', async (event, orderedIds) => {
  try {
    const warnings = warningsRepo.reorderWarnings(orderedIds);
    broadcastUpdate('warnings');
    return { success: true, data: warnings };
  } catch (error) {
    console.error('[IPC] Error reordering warnings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:saveMedia', async (event, { buffer, filename }) => {
  try {
    const url = warningsRepo.saveMediaFile(Buffer.from(buffer), filename);
    return { success: true, data: url };
  } catch (error) {
    console.error('[IPC] Error saving media:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:getMediaPath', async (event, localUrl) => {
  try {
    const path = warningsRepo.getMediaFilePath(localUrl);
    return { success: true, data: path };
  } catch (error) {
    console.error('[IPC] Error getting media path:', error);
    return { success: false, error: error.message };
  }
});

// --- SETTINGS ---
ipcMain.handle('db:settings:get', async (event, key) => {
  try {
    return { success: true, data: settingsRepo.getSetting(key) };
  } catch (error) {
    console.error('[IPC] Error getting setting:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:settings:getAll', async () => {
  try {
    return { success: true, data: settingsRepo.getAllSettings() };
  } catch (error) {
    console.error('[IPC] Error getting all settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:settings:set', async (event, { key, value, description }) => {
  try {
    settingsRepo.setSetting(key, value, description);
    broadcastUpdate('settings');
    return { success: true };
  } catch (error) {
    console.error('[IPC] Error setting setting:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:settings:setMultiple', async (event, settings) => {
  try {
    const result = settingsRepo.setMultipleSettings(settings);
    broadcastUpdate('settings');
    return { success: true, data: result };
  } catch (error) {
    console.error('[IPC] Error setting multiple settings:', error);
    return { success: false, error: error.message };
  }
});

// --- RSS ---
ipcMain.handle('rss:fetch', async (event, url) => {
  try {
    // Se não passou URL, busca do settings
    const feedUrl = url || settingsRepo.getRssUrl();
    const items = await fetchRssFeed(feedUrl);
    return { success: true, data: items };
  } catch (error) {
    console.error('[IPC] Error fetching RSS:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// IPC Handlers para Autenticação Local
// ============================================

ipcMain.handle('auth:login', async (event, { email, password }) => {
  try {
    const user = authRepo.authenticate(email, password);
    if (!user) {
      return { success: false, error: 'Email ou senha incorretos' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('[IPC] Error authenticating:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:updateCredentials', async (event, { userId, email, password, name }) => {
  try {
    const user = authRepo.updateCredentials(userId, email, password, name);
    return { success: true, data: user };
  } catch (error) {
    console.error('[IPC] Error updating credentials:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:getUser', async (event, userId) => {
  try {
    const user = authRepo.getUserById(userId);
    if (user) {
      const { password_hash, ...safeUser } = user;
      return { success: true, data: safeUser };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    console.error('[IPC] Error getting user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:isFirstLogin', async (event, userId) => {
  try {
    const isFirst = authRepo.isFirstLogin(userId);
    return { success: true, data: isFirst };
  } catch (error) {
    console.error('[IPC] Error checking first login:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:updateDestination', async (event, { userId, destination }) => {
  try {
    const user = authRepo.updateUserDestination(userId, destination);
    const { password_hash, ...safeUser } = user;
    return { success: true, data: safeUser };
  } catch (error) {
    console.error('[IPC] Error updating user destination:', error);
    return { success: false, error: error.message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  // Inicializa o banco de dados local
  initDatabase();
  console.log('[App] Local database initialized');
  
  // Garante que existe um usuário padrão
  authRepo.ensureDefaultUser();
  console.log('[App] Default user ensured');
  
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // No Windows, manter app rodando mesmo sem janelas (fica no tray)
  if (process.platform !== 'darwin') {
    // Não fazer quit automático
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  // Fecha o banco de dados ao sair
  closeDatabase();
});

// Prevenir múltiplas instâncias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

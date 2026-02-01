import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification, protocol, net } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AutoLaunch = require('auto-launch');
import { initializeTTS, generatePatientAudio, deletePatientAudio, generateWarningAudio, deleteWarningAudio, getWarningAudioDir, getPatientAudioDir } from './services/ttsService.js';
import { startAudioServer, getMediaUrl, getWarningAudioUrl, getPatientAudioUrl } from './services/audioServer.js';
import { fetchRssFeed } from './services/rssService.js';
import { 
    initDatabase, 
    closeDatabase,
    patientsRepo, 
    warningsRepo, 
    settingsRepo,
    authRepo,
    getUploadsPath,
    cleanupOrphanedTTSAudio
} from './database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar serviços de áudio
initializeTTS();
startAudioServer();

const isDev = !app.isPackaged;

// Configuração do Auto Updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Events do Auto Updater
autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Checking for updates...');
  if (mainWindow) mainWindow.webContents.send('update:status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Update available:', info);
  if (mainWindow) mainWindow.webContents.send('update:status', { status: 'available', info });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[Updater] Update not available');
  if (mainWindow) mainWindow.webContents.send('update:status', { status: 'not-available', info });
});

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error:', err);
  if (mainWindow) mainWindow.webContents.send('update:status', { status: 'error', error: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`[Updater] Download progress: ${progressObj.percent}%`);
  if (mainWindow) mainWindow.webContents.send('update:download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Update downloaded');
  if (mainWindow) mainWindow.webContents.send('update:status', { status: 'downloaded', info });
  
  // Notificação nativa
  if (Notification.isSupported()) {
    new Notification({
      title: 'Atualização Pronta',
      body: 'Uma nova versão foi baixada e será instalada ao fechar o app.'
    }).show();
  }
});

let mainWindow = null;
let displayWindows = []; // Array para múltiplas janelas de display
let tray = null;
let isQuitting = false;

// Registrar o protocolo 'local' como privilegiado ANTES do app.whenReady
protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'local', 
    privileges: { 
      secure: true, 
      supportFetchAPI: true, 
      stream: true,
      bypassCSP: true,
      standard: true
    } 
  }
]);

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
      autoplayPolicy: 'no-user-gesture-required', // Permite autoplay sem interação
    },
  });

  if (isDev) {
    // HashRouter usa # na URL
    displayWindow.loadURL('http://localhost:5173/#/display');
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

// Handler legacy para TTS (não mais usado - áudio é pré-gerado)
ipcMain.handle('generate-tts', async (event, text) => {
  console.log('[TTS] generate-tts chamado (deprecado) - áudio deve ser pré-gerado');
  return null;
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
    return { success: true, data: patientsRepo.listPatients().map(convertPatientUrls) };
  } catch (error) {
    console.error('[IPC] Error listing patients:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:get', async (event, id) => {
  try {
    return { success: true, data: convertPatientUrls(patientsRepo.getPatientById(id)) };
  } catch (error) {
    console.error('[IPC] Error getting patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:add', async (event, { name, destination }) => {
  try {
    const patient = patientsRepo.addPatient({ name, destination });
    
    // Gerar áudio pré-gerado para chamada
    try {
      const audioFilename = await generatePatientAudio(patient.id, name, destination);
      if (audioFilename) {
        patient.audio_url = getPatientAudioUrl(audioFilename);
        patientsRepo.updatePatient(patient.id, { audio_url: audioFilename });
      }
    } catch (audioErr) {
      console.error('[IPC] Error generating patient audio:', audioErr);
    }
    
    broadcastUpdate('patients');
    return { success: true, data: convertPatientUrls(patient) };
  } catch (error) {
    console.error('[IPC] Error adding patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:addByNumber', async (event, { destination }) => {
  try {
    const patient = patientsRepo.addPatientByNumber(destination);
    
    // Gerar áudio pré-gerado para chamada por número
    try {
      const audioFilename = await generatePatientAudio(patient.id, patient.name, destination);
      if (audioFilename) {
        patient.audio_url = getPatientAudioUrl(audioFilename);
        patientsRepo.updatePatient(patient.id, { audio_url: audioFilename });
      }
    } catch (audioErr) {
      console.error('[IPC] Error generating patient audio:', audioErr);
    }
    
    broadcastUpdate('patients');
    return { success: true, data: convertPatientUrls(patient) };
  } catch (error) {
    console.error('[IPC] Error adding patient by number:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:update', async (event, { id, updates }) => {
  try {
    // Buscar paciente atual para comparar
    const currentPatient = patientsRepo.getPatientById(id);
    const patient = patientsRepo.updatePatient(id, updates);
    
    // Se nome ou destino mudou, regenerar áudio
    if (updates.name !== undefined || updates.destination !== undefined) {
      const newName = updates.name || currentPatient.name;
      const newDestination = updates.destination || currentPatient.destination;
      
      try {
        // Deletar áudio antigo
        deletePatientAudio(id);
        
        // Gerar novo áudio
        const audioFilename = await generatePatientAudio(id, newName, newDestination);
        if (audioFilename) {
          patient.audio_url = getPatientAudioUrl(audioFilename);
          patientsRepo.updatePatient(id, { audio_url: audioFilename });
        }
      } catch (audioErr) {
        console.error('[IPC] Error regenerating patient audio:', audioErr);
      }
    }
    
    broadcastUpdate('patients');
    return { success: true, data: convertPatientUrls(patient) };
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
    return { success: true, data: convertPatientUrls(patient) };
  } catch (error) {
    console.error('[IPC] Error calling patient:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:remove', async (event, id) => {
  try {
    // Deletar áudio do paciente
    deletePatientAudio(id);
    
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
    // Buscar todos os pacientes para deletar áudios
    const patients = patientsRepo.listPatients ? patientsRepo.listPatients() : [];
    for (const patient of patients) {
      deletePatientAudio(patient.id);
    }
    
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
    return { success: true, data: patientsRepo.getWaitingPatients().map(convertPatientUrls) };
  } catch (error) {
    console.error('[IPC] Error getting waiting patients:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:patient:getLastCalled', async () => {
  try {
    return { success: true, data: convertPatientUrls(patientsRepo.getLastCalledPatient()) };
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
    const lastCall = patientsRepo.getLastCall();
    if (lastCall && lastCall.patient) {
      lastCall.patient = convertPatientUrls(lastCall.patient);
    }
    return { success: true, data: lastCall };
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

// Helper para converter URLs local:// para HTTP e adicionar audio_url
function convertWarningUrls(warning) {
  if (!warning) return warning;
  return {
    ...warning,
    // background_url: getMediaUrl(warning.background_url), // Retorna URL local para usar o protocolo otimizado
    background_url: warning.background_url,
    audio_url: warning.audio_url ? getWarningAudioUrl(warning.audio_url) : null,
  };
}

// Helper para converter audio_url de paciente para HTTP
function convertPatientUrls(patient) {
  if (!patient) return patient;
  return {
    ...patient,
    audio_url: patient.audio_url ? getPatientAudioUrl(patient.audio_url) : null,
  };
}

// --- WARNINGS ---
ipcMain.handle('db:warning:list', async () => {
  try {
    const warnings = warningsRepo.listWarnings().map(convertWarningUrls);
    return { success: true, data: warnings };
  } catch (error) {
    console.error('[IPC] Error listing warnings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:listActive', async () => {
  try {
    const warnings = warningsRepo.listActiveWarnings().map(convertWarningUrls);
    return { success: true, data: warnings };
  } catch (error) {
    console.error('[IPC] Error listing active warnings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:get', async (event, id) => {
  try {
    const warning = convertWarningUrls(warningsRepo.getWarningById(id));
    return { success: true, data: warning };
  } catch (error) {
    console.error('[IPC] Error getting warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:add', async (event, warning) => {
  try {
    // Primeiro cria o warning
    let newWarning = warningsRepo.addWarning(warning);
    
    // Gera áudio TTS automaticamente se tiver texto (em background)
    if (warning.text && warning.text.trim()) {
      generateWarningAudio(warning.text, newWarning.id)
        .then(audioFilename => {
          if (audioFilename) {
            // Atualiza o warning com o áudio gerado
            warningsRepo.updateWarning(newWarning.id, { audio_url: audioFilename });
            console.log(`[IPC] TTS audio generated for warning ${newWarning.id}`);
            broadcastUpdate('warnings'); // Notifica que o áudio está pronto
          }
        })
        .catch(err => console.error('[IPC] Error generating TTS for warning:', err));
    }
    
    broadcastUpdate('warnings');
    return { success: true, data: convertWarningUrls(newWarning) };
  } catch (error) {
    console.error('[IPC] Error adding warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:update', async (event, { id, updates }) => {
  try {
    // Busca o warning atual para comparar o texto
    const currentWarning = warningsRepo.getWarningById(id);
    
    // Atualiza o warning
    let warning = warningsRepo.updateWarning(id, updates);
    
    // Se o texto mudou, regenera o áudio
    if (updates.text !== undefined && updates.text !== currentWarning?.text) {
      // Remove áudio antigo se existir
      if (currentWarning?.audio_url) {
        deleteWarningAudio(id);
      }
      
      // Gera novo áudio se tiver texto (em background)
      if (updates.text && updates.text.trim()) {
        generateWarningAudio(updates.text, id)
          .then(audioFilename => {
            if (audioFilename) {
              warningsRepo.updateWarning(id, { audio_url: audioFilename });
              console.log(`[IPC] TTS audio regenerated for warning ${id}`);
              broadcastUpdate('warnings');
            }
          })
          .catch(err => console.error('[IPC] Error regenerating TTS for warning:', err));
      } else {
        // Se não tem mais texto, remove o áudio
        warningsRepo.updateWarning(id, { audio_url: null });
      }
    }
    
    broadcastUpdate('warnings');
    return { success: true, data: convertWarningUrls(warning) };
  } catch (error) {
    console.error('[IPC] Error updating warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:remove', async (event, id) => {
  try {
    // Remove o áudio TTS associado
    deleteWarningAudio(id);
    
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
    const warning = convertWarningUrls(warningsRepo.toggleWarningActive(id));
    broadcastUpdate('warnings');
    return { success: true, data: warning };
  } catch (error) {
    console.error('[IPC] Error toggling warning:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:warning:reorder', async (event, orderedIds) => {
  try {
    const warnings = warningsRepo.reorderWarnings(orderedIds).map(convertWarningUrls);
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

// --- AUTO UPDATER ---
ipcMain.handle('update:check', async () => {
  if (!isDev) {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Cannot check for updates in dev mode' };
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
});

// App lifecycle
app.whenReady().then(() => {
  // Registra o handler para o protocolo 'local://'
  // Este handler serve arquivos de mídia salvos localmente
  protocol.handle('local', async (request) => {
    try {
      // URL vem como local://filename.ext ou local://filename.ext/
      const url = new URL(request.url);
      
      // Decodificar o hostname e pathname para lidar com espaços e caracteres especiais
      let filename = decodeURIComponent(url.hostname);
      
      // Se pathname tem algo além de /, adiciona (caso de subpastas)
      if (url.pathname && url.pathname !== '/') {
        filename += decodeURIComponent(url.pathname);
      }
      
      // Remove barras extras no início e no final
      filename = filename.replace(/^\/+/, '').replace(/\/+$/, '');
      
      const uploadsPath = getUploadsPath();
      const filePath = path.join(uploadsPath, filename);
      
      console.log('[Protocol] ===== REQUEST =====');
      console.log('[Protocol] Request URL:', request.url);
      console.log('[Protocol] Final filename:', filename);
      console.log('[Protocol] Full file path:', filePath);
      
      // Verifica se o arquivo existe
      if (!fs.existsSync(filePath)) {
        console.error('[Protocol] ❌ File not found:', filePath);
        return new Response('File not found', { status: 404 });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = request.headers.get('Range');
      
      // Determinar Content-Type
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.ogg') contentType = 'video/ogg';
      else if (ext === '.mov') contentType = 'video/quicktime';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';

      // Tratamento de Range Request (Streaming de Vídeo)
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        if (start >= fileSize) {
          return new Response('Requested range not satisfiable', { 
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`
            }
          });
        }

        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        
        // Converter stream do node para Web ReadableStream
        const readable = new ReadableStream({
          start(controller) {
            fileStream.on('data', (chunk) => controller.enqueue(chunk));
            fileStream.on('end', () => controller.close());
            fileStream.on('error', (err) => controller.error(err));
          }
        });

        return new Response(readable, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Request sem Range (Download completo)
      const fileStream = fs.createReadStream(filePath);
      const readable = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        }
      });

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('[Protocol] ❌ Error serving local file:', error);
      return new Response('Error loading file: ' + error.message, { status: 500 });
    }
  });
  console.log('[App] Local protocol handler registered');
  
  // Inicializa o banco de dados local
  initDatabase();
  console.log('[App] Local database initialized');
  
  // Garante que existe um usuário padrão
  authRepo.ensureDefaultUser();
  console.log('[App] Default user ensured');
  
  // Limpa áudios TTS órfãos na inicialização
  cleanupOrphanedTTSAudio();
  console.log('[App] Orphaned TTS audio cleanup completed');
  
  // Agenda limpeza periódica de áudios órfãos (a cada 6 horas)
  setInterval(() => {
    console.log('[App] Running periodic TTS audio cleanup...');
    cleanupOrphanedTTSAudio();
  }, 6 * 60 * 60 * 1000);
  
  createWindow();
  createTray();

  // Verificar atualizações após iniciar (apenas em produção)
  if (!isDev) {
    // Delay curto para garantir que a janela carregou
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  }

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

import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import AutoLaunch from 'auto-launch';
import { initializeTTS, generateSpeech } from './services/ttsService.js';
import { startAudioServer, getAudioUrl } from './services/audioServer.js';

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

// App lifecycle
app.whenReady().then(() => {
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

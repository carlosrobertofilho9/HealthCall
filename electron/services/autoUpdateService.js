import updater from 'electron-updater';

const autoUpdater = updater?.autoUpdater ?? updater?.default?.autoUpdater ?? updater;

export function configureAutoUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
}

export function registerAutoUpdaterEvents({ getMainWindow, Notification }) {
  if (!autoUpdater) return;

  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
    const mainWindow = getMainWindow?.();
    if (mainWindow) mainWindow.webContents.send('update:status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info);
    const mainWindow = getMainWindow?.();
    if (mainWindow) mainWindow.webContents.send('update:status', { status: 'available', info });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] Update not available');
    const mainWindow = getMainWindow?.();
    if (mainWindow) mainWindow.webContents.send('update:status', { status: 'not-available', info });
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err);
    const mainWindow = getMainWindow?.();
    if (mainWindow) mainWindow.webContents.send('update:status', { status: 'error', error: err.message });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[Updater] Download progress: ${progressObj.percent}%`);
    const mainWindow = getMainWindow?.();
    if (mainWindow) mainWindow.webContents.send('update:download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded');
    const mainWindow = getMainWindow?.();
    if (mainWindow) mainWindow.webContents.send('update:status', { status: 'downloaded', info });

    if (Notification?.isSupported?.()) {
      new Notification({
        title: 'Atualização Pronta',
        body: 'Uma nova versão foi baixada e será instalada ao fechar o app.'
      }).show();
    }
  });
}

export { autoUpdater };

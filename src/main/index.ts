import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { registerIPCHandlers } from './ipc/ipcHandlers';
import { ConfigManager } from './config/ConfigManager';
import { TerminalManager } from './terminal/TerminalManager';

let mainWindow: BrowserWindow | null = null;
let terminalManager: TerminalManager;
let configManager: ConfigManager;

const isDev = !app.isPackaged;

process.on('uncaughtException', (error) => {
  console.error('[Main Process] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main Process] Unhandled Rejection:', reason);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    title: `SmartTerminal v${app.getVersion()}`,
    show: false,
    autoHideMenuBar: true
  });

  Menu.setApplicationMenu(null);

  const preloadPath = path.join(__dirname, 'preload.js');
  const htmlPath = path.join(__dirname, '../renderer/index.html');
  console.log('[Main] Preload path:', preloadPath);
  console.log('[Main] HTML path:', htmlPath);
  console.log('[Main] __dirname:', __dirname);
  console.log('[Main] isPackaged:', app.isPackaged);

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[Main] Page failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page finished loading');
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[Main] Preload error:', preloadPath, error);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['verbose', 'info', 'warning', 'error'];
    console.log(`[Renderer:${levels[level] || level}]`, message, sourceId ? `(${sourceId}:${line})` : '');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(htmlPath);
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show');
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  try {
    console.log('[Main] App ready, initializing...');
    configManager = new ConfigManager();
    console.log('[Main] ConfigManager created');
    terminalManager = new TerminalManager(null);
    console.log('[Main] TerminalManager created');

    registerIPCHandlers(ipcMain, terminalManager, configManager);
    console.log('[Main] IPC handlers registered');

    createWindow();
    terminalManager.setMainWindow(mainWindow);
    console.log('[Main] Window created and set to TerminalManager');

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error: any) {
    console.error('[Main] Fatal error during initialization:', error);
  }
});

app.on('window-all-closed', () => {
  if (terminalManager) {
    terminalManager.closeAll();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export { terminalManager, configManager };

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { registerIPCHandlers } from './ipc/ipcHandlers';
import { ConfigManager } from './config/ConfigManager';
import { TerminalManager } from './terminal/TerminalManager';

let mainWindow: BrowserWindow | null = null;
let terminalManager: TerminalManager;
let configManager: ConfigManager;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    title: `SmartTerminal v${app.getVersion()}`,
    show: false
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  configManager = new ConfigManager();
  terminalManager = new TerminalManager(mainWindow);
  
  registerIPCHandlers(ipcMain, terminalManager, configManager);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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

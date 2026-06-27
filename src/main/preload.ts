import { contextBridge, ipcRenderer } from 'electron';
import { app } from 'electron';
import { 
  SSHConfig, 
  AppConfig, 
  AIAnalyzeRequest, 
  TerminalData, 
  CreateTerminalResult, 
  TestAPIResult,
  AIAnalysisResult,
  IPC_CHANNELS
} from '../shared/types';

interface ElectronAPI {
  getVersion: () => string;
  createLocalTerminal: () => Promise<CreateTerminalResult>;
  createSSHTerminal: (config: SSHConfig) => Promise<CreateTerminalResult>;
  writeToTerminal: (terminalId: string, data: string) => void;
  resizeTerminal: (terminalId: string, cols: number, rows: number) => void;
  closeTerminal: (terminalId: string) => void;
  attachTerminal: (terminalId: string) => void;
  analyzeWithAI: (data: AIAnalyzeRequest) => Promise<AIAnalysisResult>;
  getConfig: () => Promise<AppConfig>;
  setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
  testAPI: (config?: Partial<AppConfig['api']>) => Promise<TestAPIResult>;
  checkBlacklist: (command: string) => Promise<boolean>;
  onTerminalData: (callback: (data: TerminalData) => void) => () => void;
  onTerminalExit: (callback: (terminalId: string) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  getVersion: () => app.getVersion(),
  createLocalTerminal: () => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE_LOCAL),
  createSSHTerminal: (config: SSHConfig) => ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_CREATE_SSH, config),
  writeToTerminal: (terminalId: string, data: string) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_WRITE, { terminalId, data }),
  resizeTerminal: (terminalId: string, cols: number, rows: number) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_RESIZE, { terminalId, cols, rows }),
  closeTerminal: (terminalId: string) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_CLOSE, terminalId),
  attachTerminal: (terminalId: string) => ipcRenderer.send(IPC_CHANNELS.TERMINAL_ATTACH, terminalId),
  analyzeWithAI: (data: AIAnalyzeRequest) => ipcRenderer.invoke(IPC_CHANNELS.AI_ANALYZE, data),
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  setConfig: (config: Partial<AppConfig>) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),
  testAPI: (config?: Partial<AppConfig['api']>) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_TEST_API, config),
  checkBlacklist: (command: string) => ipcRenderer.invoke(IPC_CHANNELS.CHECK_BLACKLIST, command),
  onTerminalData: (callback: (data: TerminalData) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: TerminalData) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.TERMINAL_DATA, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_DATA, handler);
  },
  onTerminalExit: (callback: (terminalId: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, terminalId: string) => callback(terminalId);
    ipcRenderer.on(IPC_CHANNELS.TERMINAL_EXIT, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TERMINAL_EXIT, handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
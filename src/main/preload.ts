import { contextBridge, ipcRenderer } from 'electron';
import { app } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => app.getVersion(),
  createLocalTerminal: () => ipcRenderer.invoke('terminal:create-local'),
  createSSHTerminal: (config: any) => ipcRenderer.invoke('terminal:create-ssh', config),
  writeToTerminal: (terminalId: string, data: string) => ipcRenderer.send('terminal:write', { terminalId, data }),
  resizeTerminal: (terminalId: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', { terminalId, cols, rows }),
  closeTerminal: (terminalId: string) => ipcRenderer.send('terminal:close', terminalId),
  analyzeWithAI: (data: any) => ipcRenderer.invoke('ai:analyze', data),
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: any) => ipcRenderer.invoke('config:set', config),
  testAPI: (config?: any) => ipcRenderer.invoke('config:test-api', config),
  checkBlacklist: (command: string) => ipcRenderer.invoke('ai:check-blacklist', command),
  onTerminalData: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('terminal:data', handler);
    return () => ipcRenderer.removeListener('terminal:data', handler);
  },
  onTerminalExit: (callback: (terminalId: string) => void) => {
    const handler = (_event: any, terminalId: string) => callback(terminalId);
    ipcRenderer.on('terminal:exit', handler);
    return () => ipcRenderer.removeListener('terminal:exit', handler);
  }
});

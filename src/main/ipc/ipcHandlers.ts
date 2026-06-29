import { IpcMain, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import { TerminalManager } from '../terminal/TerminalManager';
import { ConfigManager } from '../config/ConfigManager';
import { Analyzer } from '../ai/Analyzer';
import { IPC_CHANNELS, SSHConfig, AIAnalyzeRequest, AppConfig } from '../../shared/types';
import os from 'os';

function validateSender(event: IpcMainInvokeEvent | IpcMainEvent): boolean {
  if (!event.sender) {
    console.warn(`IPC request rejected: no sender`);
    return false;
  }
  if (event.sender.isDestroyed()) {
    console.warn(`IPC request rejected: sender is destroyed`);
    return false;
  }
  return true;
}

export function registerIPCHandlers(
  ipcMain: IpcMain,
  terminalManager: TerminalManager,
  configManager: ConfigManager
): void {
  const analyzer = new Analyzer(configManager.getAPIConfig());

  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE_LOCAL, async (event, _args) => {
    if (!validateSender(event)) {
      return { success: false, error: 'Invalid request source' };
    }
    try {
      const result = await terminalManager.createLocalTerminal();
      return { success: true, terminalId: result.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE_SSH, async (event, config: SSHConfig) => {
    if (!validateSender(event)) {
      return { success: false, error: 'Invalid request source' };
    }
    try {
      const result = await terminalManager.createSSHTerminal(config);
      return { success: true, terminalId: result.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_WRITE, (event, data: { terminalId: string; data: string }) => {
    if (!validateSender(event)) return;
    terminalManager.writeToTerminal(data.terminalId, data.data);
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_RESIZE, (event, data: { terminalId: string; cols: number; rows: number }) => {
    if (!validateSender(event)) return;
    terminalManager.resizeTerminal(data.terminalId, data.cols, data.rows);
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_CLOSE, (event, terminalId: string) => {
    if (!validateSender(event)) return;
    terminalManager.closeTerminal(terminalId);
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_ATTACH, (event, terminalId: string) => {
    if (!validateSender(event)) return;
    terminalManager.attachTerminal(terminalId);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async (event) => {
    if (!validateSender(event)) {
      return null;
    }
    return configManager.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (event, config: Partial<AppConfig>) => {
    if (!validateSender(event)) {
      return null;
    }
    try {
      const savedConfig = configManager.setConfig(config);
      if (config.api) {
        analyzer.updateConfig(configManager.getAPIConfig());
      }
      return savedConfig;
    } catch (error: any) {
      console.error('Failed to save config:', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_TEST_API, async (event, config?: any) => {
    if (!validateSender(event)) {
      return { success: false, message: 'Invalid request source' };
    }
    return configManager.testAPIConnection(config);
  });

  ipcMain.handle(IPC_CHANNELS.AI_ANALYZE, async (event, request: AIAnalyzeRequest) => {
    if (!validateSender(event)) {
      return {
        analysis: 'Invalid request source',
        suggestions: [],
        isTaskComplete: false
      };
    }
    try {
      const platform = os.platform() === 'win32' ? 'Windows' : 'Linux/Unix';
      const result = await analyzer.analyze(
        request.command,
        request.output,
        request.history || [],
        process.cwd(),
        platform
      );
      return result;
    } catch (error: any) {
      return {
        analysis: `分析出错: ${error.message}`,
        suggestions: [],
        isTaskComplete: false
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CHECK_BLACKLIST, async (event, command: string) => {
    if (!validateSender(event)) {
      return false;
    }
    return configManager.isBlacklisted(command.trim());
  });
}

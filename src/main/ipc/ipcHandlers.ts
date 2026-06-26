import { IpcMain } from 'electron';
import { TerminalManager } from '../terminal/TerminalManager';
import { ConfigManager } from '../config/ConfigManager';
import { Analyzer } from '../ai/Analyzer';
import { IPC_CHANNELS, SSHConfig, AIAnalyzeRequest, AppConfig } from '../../shared/types';
import os from 'os';

export function registerIPCHandlers(
  ipcMain: IpcMain,
  terminalManager: TerminalManager,
  configManager: ConfigManager
): void {
  const analyzer = new Analyzer(configManager.getAPIConfig());

  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE_LOCAL, async (_event, _args) => {
    try {
      const result = await terminalManager.createLocalTerminal();
      return { success: true, terminalId: result.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE_SSH, async (_event, config: SSHConfig) => {
    try {
      const result = await terminalManager.createSSHTerminal(config);
      return { success: true, terminalId: result.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_WRITE, (_event, data: { terminalId: string; data: string }) => {
    terminalManager.writeToTerminal(data.terminalId, data.data);
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_RESIZE, (_event, data: { terminalId: string; cols: number; rows: number }) => {
    terminalManager.resizeTerminal(data.terminalId, data.cols, data.rows);
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_CLOSE, (_event, terminalId: string) => {
    terminalManager.closeTerminal(terminalId);
  });

  ipcMain.on(IPC_CHANNELS.TERMINAL_ATTACH, (_event, terminalId: string) => {
    terminalManager.attachTerminal(terminalId);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    return configManager.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (_event, config: Partial<AppConfig>) => {
    const savedConfig = configManager.setConfig(config);
    if (config.api) {
      analyzer.updateConfig(configManager.getAPIConfig());
    }
    return savedConfig;
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_TEST_API, async (_event, config?: any) => {
    return configManager.testAPIConnection(config);
  });

  ipcMain.handle(IPC_CHANNELS.AI_ANALYZE, async (_event, request: AIAnalyzeRequest) => {
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

  ipcMain.handle(IPC_CHANNELS.CHECK_BLACKLIST, async (_event, command: string) => {
    return configManager.isBlacklisted(command.trim());
  });
}

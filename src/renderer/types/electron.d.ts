import { SSHConfig, AppConfig, AIAnalysisResult, AIAnalyzeRequest, TestAPIResult, TerminalData } from '../../shared/types';

declare global {
  interface Window {
    electronAPI: {
      createLocalTerminal: () => Promise<{ success: boolean; terminalId?: string; error?: string }>;
      createSSHTerminal: (config: SSHConfig) => Promise<{ success: boolean; terminalId?: string; error?: string }>;
      writeToTerminal: (terminalId: string, data: string) => void;
      resizeTerminal: (terminalId: string, cols: number, rows: number) => void;
      closeTerminal: (terminalId: string) => void;
      analyzeWithAI: (data: AIAnalyzeRequest) => Promise<AIAnalysisResult>;
      getConfig: () => Promise<AppConfig>;
      setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
      testAPI: (config?: any) => Promise<TestAPIResult>;
      checkBlacklist: (command: string) => Promise<boolean>;
      onTerminalData: (callback: (data: TerminalData) => void) => () => void;
      onTerminalExit: (callback: (terminalId: string) => void) => () => void;
    };
  }
}

export {};

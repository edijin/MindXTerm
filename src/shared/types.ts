export interface TerminalInfo {
  id: string;
  type: 'local' | 'ssh';
  title: string;
  cwd?: string;
  sshConfig?: SSHConfig;
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface APIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AppConfig {
  api: APIConfig;
  blacklist: string[];
  terminal: {
    fontSize: number;
    fontFamily: string;
    theme: 'dark' | 'light';
  };
}

export interface AISuggestion {
  id: string;
  command: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

export interface AIAnalysisResult {
  analysis: string;
  suggestions: AISuggestion[];
  isTaskComplete: boolean;
  expectedOutcome?: string;
}

export interface TerminalData {
  terminalId: string;
  data: string;
}

export interface TerminalResizeData {
  terminalId: string;
  cols: number;
  rows: number;
}

export interface TerminalWriteData {
  terminalId: string;
  data: string;
}

export interface AIAnalyzeRequest {
  terminalId: string;
  command: string;
  output: string;
  history: CommandHistory[];
}

export interface CommandHistory {
  command: string;
  output: string;
  timestamp: number;
  exitCode?: number;
}

export interface CreateTerminalResult {
  success: boolean;
  terminalId?: string;
  error?: string;
}

export interface TestAPIResult {
  success: boolean;
  message: string;
}

export const IPC_CHANNELS = {
  TERMINAL_CREATE_LOCAL: 'terminal:create-local',
  TERMINAL_CREATE_SSH: 'terminal:create-ssh',
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_CLOSE: 'terminal:close',
  TERMINAL_ATTACH: 'terminal:attach',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_EXIT: 'terminal:exit',
  SSH_CONNECT: 'ssh:connect',
  SSH_DISCONNECT: 'ssh:disconnect',
  AI_ANALYZE: 'ai:analyze',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_TEST_API: 'config:test-api',
  CHECK_BLACKLIST: 'ai:check-blacklist'
} as const;

export const DEFAULT_CONFIG: AppConfig = {
  api: {
    baseURL: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 2000
  },
  blacklist: [
    'rm -rf /',
    'rm -rf /*',
    'mkfs',
    'dd if=/dev/zero',
    ':() { :|:& };:',
    'chmod -R 777 /',
    'shutdown',
    'reboot',
    'halt',
    'poweroff',
    'format',
    'fdisk',
    'dropdb',
    'DROP DATABASE',
    'TRUNCATE'
  ],
  terminal: {
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: 'dark'
  }
};

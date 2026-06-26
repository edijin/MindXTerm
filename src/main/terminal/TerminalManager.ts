import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { LocalTerminal } from './LocalTerminal';
import { SSHTerminal } from './SSHTerminal';
import { SSHConfig, IPC_CHANNELS } from '../../shared/types';

type TerminalInstance = LocalTerminal | SSHTerminal;

export class TerminalManager extends EventEmitter {
  private terminals: Map<string, TerminalInstance> = new Map();
  private mainWindow: BrowserWindow | null;
  private terminalCounter: number = 0;
  // 渲染进程尚未 attach 的终端：缓存其早期输出，attach 后一次性 flush，
  // 避免终端创建与 xterm 监听注册之间的竞态导致初始 banner/prompt 丢失
  private pendingData: Map<string, string[]> = new Map();
  private attachedTerminals: Set<string> = new Set();

  constructor(mainWindow: BrowserWindow | null) {
    super();
    this.mainWindow = mainWindow;
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  generateId(): string {
    this.terminalCounter++;
    return `terminal-${Date.now()}-${this.terminalCounter}`;
  }

  async createLocalTerminal(cols: number = 80, rows: number = 24): Promise<{ id: string }> {
    const id = this.generateId();
    const terminal = new LocalTerminal(id);
    
    terminal.on('data', (data: string) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL_DATA, { terminalId: id, data });
    });

    terminal.on('exit', () => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL_EXIT, id);
      this.terminals.delete(id);
    });

    terminal.on('error', (message: string) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL_DATA, { terminalId: id, data: `\r\n\x1b[31mError: ${message}\x1b[0m\r\n` });
    });

    terminal.start(cols, rows);
    this.terminals.set(id, terminal);
    this.pendingData.set(id, []);

    return { id };
  }

  async createSSHTerminal(config: SSHConfig, cols: number = 80, rows: number = 24): Promise<{ id: string }> {
    const id = this.generateId();
    const terminal = new SSHTerminal(id, config);
    
    terminal.on('data', (data: string) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL_DATA, { terminalId: id, data });
    });

    terminal.on('exit', () => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL_EXIT, id);
      this.terminals.delete(id);
    });

    terminal.on('error', (message: string) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL_DATA, { terminalId: id, data: `\r\n\x1b[31mSSH Error: ${message}\x1b[0m\r\n` });
    });

    try {
      await terminal.connect(cols, rows);
      this.terminals.set(id, terminal);
      this.pendingData.set(id, []);
      return { id };
    } catch (error: any) {
      throw new Error(`SSH connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  writeToTerminal(terminalId: string, data: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.write(data);
      return true;
    }
    return false;
  }

  resizeTerminal(terminalId: string, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.resize(cols, rows);
      return true;
    }
    return false;
  }

  closeTerminal(terminalId: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.close();
      this.terminals.delete(terminalId);
      this.attachedTerminals.delete(terminalId);
      this.pendingData.delete(terminalId);
      return true;
    }
    return false;
  }

  attachTerminal(terminalId: string): void {
    this.attachedTerminals.add(terminalId);
    const buffer = this.pendingData.get(terminalId);
    if (buffer && buffer.length > 0) {
      for (const data of buffer) {
        this.sendToRenderer(IPC_CHANNELS.TERMINAL_DATA, { terminalId, data });
      }
    }
    this.pendingData.delete(terminalId);
  }

  closeAll(): void {
    for (const [id, terminal] of this.terminals) {
      terminal.close();
      this.terminals.delete(id);
    }
  }

  getTerminalCount(): number {
    return this.terminals.size;
  }

  getTerminalIds(): string[] {
    return Array.from(this.terminals.keys());
  }

  private sendToRenderer(channel: string, data: any): void {
    // 终端数据：若渲染进程尚未 attach，先缓存，等 attach 后 flush
    if (channel === IPC_CHANNELS.TERMINAL_DATA) {
      const terminalId = data.terminalId;
      if (!this.attachedTerminals.has(terminalId)) {
        const buffer = this.pendingData.get(terminalId);
        if (buffer) {
          buffer.push(data.data);
        }
        return;
      }
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

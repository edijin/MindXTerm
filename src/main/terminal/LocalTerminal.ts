import { IPty, spawn } from 'node-pty';
import { EventEmitter } from 'events';
import os from 'os';

export class LocalTerminal extends EventEmitter {
  public id: string;
  private ptyProcess: IPty | null = null;
  private shell: string;
  private cwd: string;

  constructor(id: string, cwd?: string) {
    super();
    this.id = id;
    this.cwd = cwd || os.homedir();
    this.shell = this.getDefaultShell();
  }

  private getDefaultShell(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  start(cols: number = 80, rows: number = 24): void {
    const shellArgs = process.platform === 'win32' ? [] : ['-l'];
    
    try {
      this.ptyProcess = spawn(this.shell, shellArgs, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: this.cwd,
        env: process.env as { [key: string]: string },
        useConpty: process.platform === 'win32'
      });

      this.ptyProcess.onData((data) => {
        this.emit('data', data);
      });

      this.ptyProcess.onExit((exitCode) => {
        this.emit('exit', exitCode);
      });
    } catch (error: any) {
      this.emit('error', error.message || 'Failed to start terminal');
    }
  }

  write(data: string): void {
    if (this.ptyProcess) {
      this.ptyProcess.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.resize(cols, rows);
      } catch (e) {
        // Ignore resize errors
      }
    }
  }

  getCwd(): string {
    return this.cwd;
  }

  close(): void {
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
  }

  isRunning(): boolean {
    return this.ptyProcess !== null;
  }
}

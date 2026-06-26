import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { EventEmitter } from 'events';
import { SSHConfig } from '../../shared/types';

export class SSHTerminal extends EventEmitter {
  public id: string;
  private conn: Client | null = null;
  private channel: ClientChannel | null = null;
  private config: SSHConfig;
  private connected: boolean = false;

  constructor(id: string, config: SSHConfig) {
    super();
    this.id = id;
    this.config = config;
  }

  connect(cols: number = 80, rows: number = 24): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn = new Client();

      const connectConfig: ConnectConfig = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        readyTimeout: 20000,
        ...({ tryKeyboard: true } as any)
      };

      if (this.config.privateKey) {
        connectConfig.privateKey = this.config.privateKey;
        if (this.config.passphrase) {
          connectConfig.passphrase = this.config.passphrase;
        }
      }
      if (this.config.password) {
        connectConfig.password = this.config.password;
      }

      // 处理 keyboard-interactive 认证（很多 Linux 服务器要求此方式）
      (this.conn as any).on('keyboard-interactive', (
        _name: string,
        _instructions: string,
        _lang: string,
        prompts: Array<{ prompt: string; echo: boolean }>,
        finish: (responses: string[]) => void
      ) => {
        // 对所有提示都回复密码
        const responses = prompts.map(() => this.config.password || '');
        finish(responses);
      });

      this.conn.on('ready', () => {
        this.connected = true;

        this.conn!.shell({
          term: 'xterm-256color',
          cols,
          rows
        } as any, (err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            reject(err);
            return;
          }

          this.channel = stream;

          stream.on('data', (data: Buffer) => {
            this.emit('data', data.toString());
          });

          stream.stderr.on('data', (data: Buffer) => {
            this.emit('data', data.toString());
          });

          stream.on('close', () => {
            this.emit('exit', { exitCode: 0 });
            this.cleanup();
          });

          stream.on('error', (err: Error) => {
            this.emit('error', err.message);
          });

          resolve();
        });
      });

      this.conn.on('error', (err: Error) => {
        this.connected = false;
        this.emit('error', err.message);
        reject(err);
      });

      this.conn.on('close', () => {
        this.connected = false;
        this.emit('exit', { exitCode: -1 });
      });

      this.conn.on('end', () => {
        this.connected = false;
      });

      try {
        this.conn.connect(connectConfig);
      } catch (err: any) {
        reject(err);
      }
    });
  }

  write(data: string): void {
    if (this.channel && this.connected) {
      this.channel.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (this.channel && this.connected) {
      try {
        this.channel.setWindow(rows, cols, 0, 0);
      } catch (e) {
        // Ignore resize errors
      }
    }
  }

  close(): void {
    this.cleanup();
  }

  isConnected(): boolean {
    return this.connected;
  }

  private cleanup(): void {
    if (this.channel) {
      try {
        this.channel.end();
        this.channel.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.channel = null;
    }
    if (this.conn) {
      try {
        this.conn.end();
        this.conn.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.conn = null;
    }
    this.connected = false;
  }
}

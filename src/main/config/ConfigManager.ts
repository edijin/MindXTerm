import Store from 'electron-store';
import { AppConfig, DEFAULT_CONFIG, APIConfig, TestAPIResult } from '../../shared/types';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from('smart-terminal-secure-key-256-bit-encryption!', 'utf-8');

function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
      return encryptedText;
    }
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}

export class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'smart-terminal-config',
      defaults: DEFAULT_CONFIG
    });
  }

  getConfig(): AppConfig {
    const rawConfig = this.store.store;
    return {
      ...rawConfig,
      api: {
        ...rawConfig.api,
        apiKey: decrypt(rawConfig.api.apiKey)
      }
    };
  }

  setConfig(config: Partial<AppConfig>): AppConfig {
    if (config.api) {
      this.store.set('api', { 
        ...this.getRawAPIConfig(), 
        ...config.api,
        apiKey: config.api.apiKey ? encrypt(config.api.apiKey) : this.getRawAPIConfig().apiKey
      });
    }
    if (config.blacklist) {
      this.store.set('blacklist', config.blacklist);
    }
    if (config.terminal) {
      this.store.set('terminal', { ...this.getRawConfig().terminal, ...config.terminal });
    }
    return this.getConfig();
  }

  getAPIConfig(): APIConfig {
    const raw = this.store.get('api');
    return {
      ...raw,
      apiKey: decrypt(raw.apiKey)
    };
  }

  private getRawAPIConfig(): APIConfig {
    return this.store.get('api');
  }

  private getRawConfig(): AppConfig {
    return this.store.store;
  }

  setAPIConfig(apiConfig: Partial<APIConfig>): APIConfig {
    const current = this.getRawAPIConfig();
    const updated = { 
      ...current, 
      ...apiConfig,
      apiKey: apiConfig.apiKey ? encrypt(apiConfig.apiKey) : current.apiKey
    };
    this.store.set('api', updated);
    return {
      ...updated,
      apiKey: decrypt(updated.apiKey)
    };
  }

  getBlacklist(): string[] {
    return this.store.get('blacklist', DEFAULT_CONFIG.blacklist);
  }

  addToBlacklist(command: string): void {
    const blacklist = this.getBlacklist();
    if (!blacklist.includes(command)) {
      blacklist.push(command);
      this.store.set('blacklist', blacklist);
    }
  }

  removeFromBlacklist(command: string): void {
    const blacklist = this.getBlacklist();
    const index = blacklist.indexOf(command);
    if (index > -1) {
      blacklist.splice(index, 1);
      this.store.set('blacklist', blacklist);
    }
  }

  isBlacklisted(command: string): boolean {
    const blacklist = this.getBlacklist();
    const normalizedCommand = command.trim().toLowerCase();
    return blacklist.some(blackCmd => {
      const normalizedBlack = blackCmd.trim().toLowerCase();
      return normalizedCommand.startsWith(normalizedBlack) || 
             normalizedCommand.includes(normalizedBlack);
    });
  }

  async testAPIConnection(config?: APIConfig): Promise<TestAPIResult> {
    const apiConfig = config || this.getAPIConfig();
    
    if (!apiConfig.baseURL || !apiConfig.apiKey) {
      return {
        success: false,
        message: 'API 地址或密钥未配置'
      };
    }

    try {
      const url = `${apiConfig.baseURL.replace(/\/$/, '')}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Reply with OK if you can hear me.' },
            { role: 'user', content: 'Test connection, reply with only OK' }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          message: `API 请求失败 (${response.status}): ${errorData.substring(0, 200)}`
        };
      }

      const data = await response.json() as any;
      if (data.choices && data.choices[0]) {
        return {
          success: true,
          message: '连接成功！API 配置有效。'
        };
      } else {
        return {
          success: false,
          message: 'API 响应格式异常'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `连接失败: ${error.message || '未知错误'}`
      };
    }
  }
}
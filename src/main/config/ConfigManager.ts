import Store from 'electron-store';
import { AppConfig, DEFAULT_CONFIG, APIConfig, TestAPIResult } from '../../shared/types';

export class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'smart-terminal-config',
      defaults: DEFAULT_CONFIG
    });
  }

  getConfig(): AppConfig {
    return this.store.store;
  }

  setConfig(config: Partial<AppConfig>): AppConfig {
    if (config.api) {
      this.store.set('api', { ...this.getConfig().api, ...config.api });
    }
    if (config.blacklist) {
      this.store.set('blacklist', config.blacklist);
    }
    if (config.terminal) {
      this.store.set('terminal', { ...this.getConfig().terminal, ...config.terminal });
    }
    return this.getConfig();
  }

  getAPIConfig(): APIConfig {
    return this.store.get('api');
  }

  setAPIConfig(apiConfig: Partial<APIConfig>): APIConfig {
    const current = this.getAPIConfig();
    const updated = { ...current, ...apiConfig };
    this.store.set('api', updated);
    return updated;
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

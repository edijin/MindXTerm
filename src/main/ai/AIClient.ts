import { APIConfig } from '../../shared/types';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  error?: {
    message: string;
    type: string;
  };
}

export class AIClient {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  updateConfig(config: APIConfig): void {
    this.config = config;
  }

  async chat(messages: ChatMessage[], jsonMode: boolean = false): Promise<string> {
    if (!this.config.baseURL || !this.config.apiKey) {
      throw new Error('API 未配置，请先在设置中配置模型 API');
    }

    const url = `${this.config.baseURL.replace(/\/$/, '')}/chat/completions`;
    
    const body: any = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败 (${response.status}): ${errorText.substring(0, 300)}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      
      if (data.error) {
        throw new Error(`API 错误: ${data.error.message}`);
      }

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }

      throw new Error('API 返回格式异常');
    } catch (error: any) {
      if (error.message && error.message.includes('API')) {
        throw error;
      }
      throw new Error(`网络请求失败: ${error.message || '未知错误'}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.chat([
        { role: 'system', content: 'You are a test assistant. Reply with exactly "OK".' },
        { role: 'user', content: 'Test' }
      ]);
      
      if (response.includes('OK')) {
        return { success: true, message: '连接成功' };
      }
      return { success: true, message: '连接成功，但响应格式可能有差异' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

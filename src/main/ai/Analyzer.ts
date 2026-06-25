import { AIClient } from './AIClient';
import { APIConfig, AIAnalysisResult, CommandHistory, AISuggestion } from '../../shared/types';
import { v4 as uuidv4 } from '../../shared/uuid';

export class Analyzer {
  private aiClient: AIClient;

  constructor(apiConfig: APIConfig) {
    this.aiClient = new AIClient(apiConfig);
  }

  updateConfig(apiConfig: APIConfig): void {
    this.aiClient.updateConfig(apiConfig);
  }

  async analyze(
    command: string,
    output: string,
    history: CommandHistory[],
    cwd: string,
    os: string
  ): Promise<AIAnalysisResult> {
    const systemPrompt = this.buildSystemPrompt(cwd, os);
    const userPrompt = this.buildUserPrompt(command, output, history);

    try {
      const response = await this.aiClient.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        true
      );

      return this.parseResponse(response);
    } catch (error: any) {
      return {
        analysis: `AI 分析失败: ${error.message}`,
        suggestions: [],
        isTaskComplete: false
      };
    }
  }

  async verifyResult(
    command: string,
    expectedOutcome: string,
    output: string
  ): Promise<{ success: boolean; feedback: string }> {
    const prompt = `请判断以下命令执行是否达到预期效果：

执行命令: ${command}
预期效果: ${expectedOutcome}
实际输出:
${output.substring(0, 3000)}

请以JSON格式回答：
{
  "success": true/false,
  "feedback": "简洁的反馈说明"
}`;

    try {
      const response = await this.aiClient.chat(
        [
          { role: 'system', content: '你是一个命令执行结果验证助手，只返回JSON格式。' },
          { role: 'user', content: prompt }
        ],
        true
      );

      const result = JSON.parse(response);
      return {
        success: Boolean(result.success),
        feedback: result.feedback || ''
      };
    } catch (error: any) {
      return {
        success: false,
        feedback: `验证失败: ${error.message}`
      };
    }
  }

  private buildSystemPrompt(cwd: string, os: string): string {
    return `你是一个智能终端助手，运行在 ${os} 系统上，当前工作目录是 ${cwd}。

你的任务：
1. 分析用户执行的命令和输出结果
2. 判断命令是否成功执行
3. 如果遇到错误，分析错误原因
4. 提供1-3个合理的下一步命令建议
5. 判断当前任务是否已完成

重要规则：
- 只提供安全、合理的命令建议
- 不要建议破坏性命令（如 rm -rf /）
- 建议要具体、可执行
- 对于危险操作（如删除文件、修改系统配置），标记风险等级为 high
- 输出必须是合法的 JSON 格式

风险等级说明：
- low: 只读操作，无风险（ls, cat, pwd, grep 等）
- medium: 修改文件/配置，但可恢复（mkdir, touch, npm install 等）
- high: 破坏性或难以恢复的操作（rm, dd, chmod -R, DROP 等）

输出格式（严格 JSON）：
{
  "analysis": "对当前执行情况的简洁分析（中文），说明成功/失败/错误原因",
  "suggestions": [
    {
      "id": "唯一ID",
      "command": "建议执行的完整命令",
      "description": "这个命令的作用说明（中文，简洁）",
      "risk": "low|medium|high"
    }
  ],
  "isTaskComplete": true/false,
  "expectedOutcome": "如果任务未完成且给出了建议，描述执行建议后预期的结果"
}`;
  }

  private buildUserPrompt(command: string, output: string, history: CommandHistory[]): string {
    let historyStr = '';
    if (history.length > 0) {
      historyStr = '\n最近命令历史（最近5条）：\n';
      const recent = history.slice(-5);
      for (const h of recent) {
        historyStr += `$ ${h.command}\n`;
        if (h.output) {
          const shortOutput = h.output.length > 200 ? h.output.substring(0, 200) + '...' : h.output;
          historyStr += `${shortOutput}\n`;
        }
      }
    }

    const truncatedOutput = output.length > 4000 ? output.substring(0, 4000) + '\n...(输出过长已截断)' : output;

    return `刚执行的命令：${command}

命令输出：
${truncatedOutput}
${historyStr}

请分析并给出建议，只返回 JSON。`;
  }

  private parseResponse(response: string): AIAnalysisResult {
    try {
      let jsonStr = response;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      
      const suggestions: AISuggestion[] = (parsed.suggestions || []).map((s: any) => ({
        id: s.id || uuidv4(),
        command: s.command || '',
        description: s.description || '',
        risk: (['low', 'medium', 'high'].includes(s.risk) ? s.risk : 'medium') as 'low' | 'medium' | 'high'
      })).filter((s: AISuggestion) => s.command);

      return {
        analysis: parsed.analysis || '',
        suggestions,
        isTaskComplete: Boolean(parsed.isTaskComplete),
        expectedOutcome: parsed.expectedOutcome
      };
    } catch (error) {
      return {
        analysis: 'AI 响应解析失败，返回内容不是有效 JSON',
        suggestions: [],
        isTaskComplete: false
      };
    }
  }
}

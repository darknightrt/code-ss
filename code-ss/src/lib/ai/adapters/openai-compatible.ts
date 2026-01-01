/**
 * OpenAI 兼容 API 适配器
 * 支持: OpenAI, DeepSeek, 通义千问, 豆包, 自定义端点
 */

import { BaseAdapter } from './base';
import type {
  ChatRequest,
  ChatResponse,
  ProviderConfig,
  OpenAIRequestBody,
  OpenAIResponseBody,
} from '../types';
import { PROVIDER_DEFAULTS } from '../types';

export class OpenAICompatibleAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(config);
    if (!config.apiKey) {
      throw new Error('API Key is required');
    }
  }

  private getEndpoint(): string {
    const baseUrl = this.config.baseUrl || PROVIDER_DEFAULTS[this.config.provider]?.baseUrl || '';
    return `${baseUrl}/chat/completions`;
  }

  private getDefaultModel(): string {
    return this.config.model || PROVIDER_DEFAULTS[this.config.provider]?.model || 'gpt-3.5-turbo';
  }

  private buildRequestBody(request: ChatRequest): OpenAIRequestBody {
    const messages: { role: string; content: string }[] = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    messages.push(
      ...request.messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role,
        content: msg.content,
      }))
    );

    return {
      model: this.getDefaultModel(),
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      stream: request.stream || false,
    };
  }

  private parseResponse(data: OpenAIResponseBody): ChatResponse {
    const choice = data.choices?.[0];
    return {
      id: data.id || `chat-${Date.now()}`,
      content: choice?.message?.content || '',
      model: data.model,
      finishReason: choice?.finish_reason,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const endpoint = this.getEndpoint();
    const body = this.buildRequestBody(request);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data: OpenAIResponseBody = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error(`${this.config.provider} API error:`, error);
      throw new Error(
        `${this.config.provider} API 请求失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    const endpoint = this.getEndpoint();
    const body = this.buildRequestBody({ ...request, stream: true });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      console.error(`${this.config.provider} stream error:`, error);
      throw new Error(
        `${this.config.provider} 流式请求失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}

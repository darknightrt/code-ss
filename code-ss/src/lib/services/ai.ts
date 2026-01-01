'use client';

/**
 * 前端 AI 服务层
 * 通过后端 API 代理调用 AI
 */

import type { ApiProvider, ApiConfig } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

interface ChatOptions {
  provider: ApiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export async function chatWithAI(
  message: string,
  history: ChatMessage[],
  systemInstruction: string,
  apiConfig: ApiConfig
): Promise<string> {
  try {
    const messages = history.map((h) => ({
      role: h.role === 'model' ? 'assistant' : h.role,
      content: h.content,
    }));

    messages.push({ role: 'user', content: message });

    const currentSettings = apiConfig.providerSettings?.[apiConfig.provider];

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: systemInstruction,
        provider: apiConfig.provider,
        model: currentSettings?.selectedModel,
        apiKey: currentSettings?.apiKey,
        baseUrl: currentSettings?.baseUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI 请求失败');
    }

    const data = await response.json();
    return data.content || '抱歉，我暂时无法回答。';
  } catch (error) {
    console.error('Chat failed:', error);
    return `AI连接出现问题: ${error instanceof Error ? error.message : '请稍后重试'}`;
  }
}

export async function* chatWithAIStream(
  message: string,
  history: ChatMessage[],
  systemInstruction: string,
  apiConfig: ApiConfig
): AsyncGenerator<string, void, unknown> {
  try {
    const messages = history.map((h) => ({
      role: h.role === 'model' ? 'assistant' : h.role,
      content: h.content,
    }));

    messages.push({ role: 'user', content: message });

    const currentSettings = apiConfig.providerSettings?.[apiConfig.provider];

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: systemInstruction,
        provider: apiConfig.provider,
        model: currentSettings?.selectedModel,
        apiKey: currentSettings?.apiKey,
        baseUrl: currentSettings?.baseUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      yield `错误: ${error.error || 'AI 请求失败'}`;
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield '无法读取响应';
      return;
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
          if (parsed.content) {
            yield parsed.content;
          }
          if (parsed.error) {
            yield `错误: ${parsed.error}`;
            return;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  } catch (error) {
    console.error('Stream chat failed:', error);
    yield `AI连接出现问题: ${error instanceof Error ? error.message : '请稍后重试'}`;
  }
}

export async function generateStudyPlan(topic: string, level: string, apiConfig?: ApiConfig) {
  try {
    const body: Record<string, unknown> = { topic, level };
    
    if (apiConfig) {
      const currentSettings = apiConfig.providerSettings?.[apiConfig.provider];
      body.provider = apiConfig.provider;
      body.model = currentSettings?.selectedModel;
      body.apiKey = currentSettings?.apiKey;
      body.baseUrl = currentSettings?.baseUrl;
    }

    const response = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('生成失败');
    }

    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('Plan generation failed:', error);
    return [];
  }
}

export async function generateMistakeAnalysis(questionTitle: string, apiConfig?: ApiConfig): Promise<string> {
  try {
    const body: Record<string, unknown> = { questionTitle };
    
    if (apiConfig) {
      const currentSettings = apiConfig.providerSettings?.[apiConfig.provider];
      body.provider = apiConfig.provider;
      body.model = currentSettings?.selectedModel;
      body.apiKey = currentSettings?.apiKey;
      body.baseUrl = currentSettings?.baseUrl;
    }

    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('分析生成失败');
    }

    const data = await response.json();
    return data.analysis || '分析生成失败';
  } catch (error) {
    console.error('Analysis failed:', error);
    return 'AI连接失败，无法生成分析。';
  }
}

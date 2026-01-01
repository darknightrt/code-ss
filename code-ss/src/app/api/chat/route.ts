/**
 * AI 聊天 API - 非流式
 * 支持客户端配置的 API Key 和模型
 * 集成数据库持久化
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chatRepository } from '@/lib/db/repositories';
import { createApiClient, getApiKeyFromEnv } from '@/lib/ai/client';
import { PROVIDER_DEFAULTS } from '@/lib/ai/types';
import type { ApiProvider, ChatMessage } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    // 1. 认证检查
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sessionId,
      messages,
      systemPrompt,
      provider = 'deepseek',
      model,
      apiKey: clientApiKey,
      baseUrl: clientBaseUrl,
    } = body as {
      sessionId?: string;
      messages: ChatMessage[];
      systemPrompt?: string;
      provider?: ApiProvider;
      model?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    // 2. 保存用户消息到数据库（如果提供了 sessionId）
    if (sessionId) {
      const userMessage = messages[messages.length - 1];
      if (userMessage?.role === 'user') {
        await chatRepository.addMessage(sessionId, {
          role: 'user',
          content: userMessage.content,
        });
      }
    }

    // 3. 调用 AI 服务
    const apiKey = clientApiKey || getApiKeyFromEnv(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider} API Key 未配置，请在设置中配置` },
        { status: 400 }
      );
    }

    const defaults = PROVIDER_DEFAULTS[provider];
    const baseUrl = clientBaseUrl || defaults.baseUrl;

    const client = createApiClient({
      provider,
      apiKey,
      baseUrl,
      model: model || defaults.model,
    });

    const response = await client.chat({
      messages,
      systemPrompt,
      temperature: 0.7,
    });

    // 4. 保存 AI 响应到数据库（如果提供了 sessionId）
    if (sessionId && response.content) {
      await chatRepository.addMessage(sessionId, {
        role: 'model',
        content: response.content,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务暂时不可用' },
      { status: 500 }
    );
  }
}

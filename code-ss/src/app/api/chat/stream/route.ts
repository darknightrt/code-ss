/**
 * AI 聊天 API - 流式响应
 * 支持客户端配置的 API Key 和模型
 * 集成数据库持久化
 */

import { NextRequest } from 'next/server';
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
      return new Response(
        JSON.stringify({ error: '未授权，请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: `${provider} API Key 未配置，请在设置中配置` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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

    const encoder = new TextEncoder();
    let fullContent = ''; // 收集完整内容用于保存

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = client.chatStream({
            messages,
            systemPrompt,
            temperature: 0.7,
          });

          // 4. 流式响应并收集内容
          for await (const chunk of generator) {
            fullContent += chunk;
            const data = JSON.stringify({ content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // 5. 保存完整的 AI 响应到数据库（如果提供了 sessionId）
          if (sessionId && fullContent) {
            await chatRepository.addMessage(sessionId, {
              role: 'model',
              content: fullContent,
            });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream API error:', error);
    return new Response(
      JSON.stringify({ error: 'AI 服务暂时不可用' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

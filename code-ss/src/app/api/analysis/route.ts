/**
 * 错题分析 API
 * 集成数据库持久化
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { questionRepository } from '@/lib/db/repositories';
import { createApiClient, getApiKeyFromEnv } from '@/lib/ai/client';
import { PROVIDER_DEFAULTS } from '@/lib/ai/types';
import type { ApiProvider } from '@/lib/ai/types';

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

    const { 
      questionId,
      questionTitle, 
      provider: clientProvider, 
      apiKey: clientApiKey, 
      baseUrl: clientBaseUrl, 
      model: clientModel 
    } = await request.json();

    // 2. 验证题目是否在错题本中（如果提供了 questionId）
    if (questionId) {
      const isInMistakeBook = await questionRepository.isInMistakeBook(
        session.user.id,
        questionId
      );

      if (!isInMistakeBook) {
        return NextResponse.json(
          { error: '题目不在错题本中' },
          { status: 400 }
        );
      }
    }

    const provider = (clientProvider || process.env.DEFAULT_AI_PROVIDER || 'deepseek') as ApiProvider;
    const apiKey = clientApiKey || getApiKeyFromEnv(provider);

    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider} API Key 未配置，请在设置中配置` },
        { status: 400 }
      );
    }

    const defaults = PROVIDER_DEFAULTS[provider];
    const baseUrl = clientBaseUrl || defaults.baseUrl;

    // 3. 调用 AI 生成分析
    const prompt = `我是一名高级前端工程师，在面试中遇到了这个问题："${questionTitle}"并回答错误。
请为我生成一份简短的"技术难点分析小报告"（Markdown格式）。

报告应包含：
1. 💡 **核心考点**：这道题到底在考什么？
2. ⚠️ **常见误区**：为什么容易答错？
3. 🔑 **满分回答思路**：列出关键技术点（Key Points）。
4. 📚 **推荐阅读**：相关的API或源码位置。

请保持简洁有力，适合复习使用。`;

    const client = createApiClient({
      provider,
      apiKey,
      baseUrl,
      model: clientModel || defaults.model,
    });

    const response = await client.chat({
      messages: [{ role: 'user', content: prompt }],
    });

    // 4. 保存分析结果到数据库（如果提供了 questionId）
    if (questionId && response.content) {
      // 获取错题记录
      const mistakeBook = await questionRepository.getMistakeBook(session.user.id);
      const mistakeRecord = mistakeBook.find(record => record.question_id === questionId);
      
      if (mistakeRecord) {
        await questionRepository.updateMistakeAnalysis(
          mistakeRecord.id,
          response.content
        );
      }
    }

    return NextResponse.json({ analysis: response.content });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '分析生成失败' },
      { status: 500 }
    );
  }
}

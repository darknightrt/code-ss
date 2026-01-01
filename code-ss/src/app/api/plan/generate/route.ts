/**
 * AI 生成学习计划 API
 * 集成数据库持久化
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { planRepository } from '@/lib/db/repositories';
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
      topic, 
      level, 
      provider: clientProvider, 
      apiKey: clientApiKey, 
      baseUrl: clientBaseUrl, 
      model: clientModel 
    } = await request.json();

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

    // 2. 调用 AI 生成计划
    const prompt = `请为我生成一个关于 "${topic}" 的学习计划，当前水平为 "${level}"。
请生成3-5个关键学习阶段。
返回JSON格式数组，每个元素包含以下字段：title (string), description (string), category (one of 'frontend', 'backend', 'algorithm', 'soft-skills'), duration_days (number).
只返回JSON数组，不要其他内容。`;

    const client = createApiClient({
      provider,
      apiKey,
      baseUrl,
      model: clientModel || defaults.model,
    });

    const response = await client.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    // 解析 AI 响应
    let data = [];
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('Failed to parse plan JSON:', response.content);
      return NextResponse.json({ plans: [] });
    }

    // 3. 保存计划到数据库
    const now = new Date();
    let currentOffset = 0;
    const savedPlans = [];

    for (const item of data) {
      const start = new Date(now);
      start.setDate(start.getDate() + currentOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + (item.duration_days || 7));
      currentOffset += item.duration_days || 7;

      const plan = await planRepository.createPlan(session.user.id, {
        title: item.title,
        description: item.description,
        category: item.category || 'frontend',
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'pending',
        progress: 0,
      });

      savedPlans.push(plan);
    }

    // 4. 返回保存后的计划
    return NextResponse.json({ plans: savedPlans });
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json(
      { error: '学习计划生成失败' },
      { status: 500 }
    );
  }
}

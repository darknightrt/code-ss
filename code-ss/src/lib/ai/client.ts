/**
 * 统一 AI 客户端工厂 (仅服务端使用)
 */

import type { ApiProvider, ProviderConfig } from './types';
import { PROVIDER_DEFAULTS } from './types';
import { BaseAdapter, OpenAICompatibleAdapter } from './adapters';

export function createApiClient(config: ProviderConfig): BaseAdapter {
  const { provider, apiKey, baseUrl, model } = config;

  if (!apiKey) {
    throw new Error('API Key is required');
  }

  const defaults = PROVIDER_DEFAULTS[provider];
  const finalConfig: ProviderConfig = {
    provider,
    apiKey,
    baseUrl: baseUrl || defaults.baseUrl,
    model: model || defaults.model,
  };

  // 所有提供商都使用OpenAI兼容适配器
  return new OpenAICompatibleAdapter(finalConfig);
}

export function getProviderDefaults(provider: ApiProvider) {
  return PROVIDER_DEFAULTS[provider];
}

export function getApiKeyFromEnv(provider: ApiProvider): string {
  const envKeys: Partial<Record<ApiProvider | 'custom', string>> = {
    deepseek: process.env.DEEPSEEK_API_KEY || '',
    qwen: process.env.QWEN_API_KEY || '',
    doubao: process.env.DOUBAO_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    custom: process.env.CUSTOM_API_KEY || '',
  };
  return envKeys[provider] || '';
}

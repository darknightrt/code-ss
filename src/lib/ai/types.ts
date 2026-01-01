/**
 * AI 服务层类型定义 (仅服务端使用)
 */

// 只保留4个提供商：DeepSeek、通义千问、豆包、OpenAI兼容
export type ApiProvider = 'deepseek' | 'qwen' | 'doubao' | 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderConfig {
  provider: ApiProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface OpenAIRequestBody {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenAIResponseBody {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 内置提供商默认配置
// DeepSeek、通义千问、豆包有固定URL，OpenAI兼容需要用户设置URL
export const PROVIDER_DEFAULTS: Record<ApiProvider, { baseUrl: string; model: string; requiresUrl: boolean }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    requiresUrl: false,
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-max',
    requiresUrl: false,
  },
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-pro-32k',
    requiresUrl: false,
  },
  openai: {
    baseUrl: '',
    model: 'gpt-4o',
    requiresUrl: true, // OpenAI兼容API需要用户设置URL
  },
};

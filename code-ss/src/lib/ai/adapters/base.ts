/**
 * API 适配器抽象基类
 */

import type { ChatRequest, ChatResponse, ProviderConfig } from '../types';

export abstract class BaseAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  abstract chatStream(request: ChatRequest): AsyncGenerator<string, void, unknown>;

  getModel(): string {
    return this.config.model || '';
  }

  getBaseUrl(): string {
    return this.config.baseUrl || '';
  }
}

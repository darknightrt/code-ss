export type Theme = 'light' | 'dark' | 'matrix';

// API提供商类型：DeepSeek、通义千问、豆包、OpenAI兼容
export type ApiProvider = 'deepseek' | 'qwen' | 'doubao' | 'openai';

export interface UserProfile {
  username: string;
  avatar: string;
}

export interface PlanItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
  category: 'frontend' | 'backend' | 'algorithm' | 'soft-skills';
  progress: number;
}

export interface NavItem {
  id: string;
  title: string;
  description: string;
  url: string;
  iconUrl?: string;
  category: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface ModelParameters {
  temperature: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  personaId: string;
  messages: Message[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  systemPromptOverride?: string;
  modelParams: ModelParameters;
  order?: number; // 用于拖拽排序
  customPersona?: Persona; // 自定义角色配置
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  systemPrompt: string;
  description: string;
  greeting?: string; // 角色介绍语
  avatarImage?: string;
  isCustom?: boolean; // 标识是否为自定义角色
}

export interface UserStats {
  level: number;
  xp: number;
  streakDays: number;
  completedTasks: number;
  hoursFocused: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

export interface KnowledgeNode {
  id: string;
  group: number;
  radius: number;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  value: number;
}

// 自定义模型配置
export interface CustomModel {
  id: string;
  name: string;
  provider: ApiProvider;
}

// 提供商配置
export interface ProviderSettings {
  apiKey: string;
  models: CustomModel[];
  selectedModel: string;
  // 仅OpenAI兼容API需要设置
  baseUrl?: string;
}

// API配置 - providerSettings 必须存在
export interface ApiConfig {
  provider: ApiProvider;
  providerSettings: Record<ApiProvider, ProviderSettings>;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface MistakeRecord {
  id: string;
  questionId: string;
  title: string;
  addedAt: string;
  aiAnalysis?: string;
  reviewCount: number;
}

export interface FocusTrend {
  name: string;
  focus: number;
}

// AI API Types
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

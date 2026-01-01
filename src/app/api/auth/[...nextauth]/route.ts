import { handlers } from '@/auth';

/**
 * NextAuth API 路由处理器
 * 处理所有 /api/auth/* 路由
 */
export const { GET, POST } = handlers;

import { QueryClient } from '@tanstack/react-query';

/**
 * 创建 React Query 客户端配置
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 数据保持新鲜的时间（5分钟）
        staleTime: 5 * 60 * 1000,
        // 缓存时间（10分钟）
        gcTime: 10 * 60 * 1000,
        // 失败后重试次数
        retry: 1,
        // 重试延迟
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // 窗口重新获得焦点时重新获取数据
        refetchOnWindowFocus: false,
        // 网络重新连接时重新获取数据
        refetchOnReconnect: true,
      },
      mutations: {
        // 失败后重试次数
        retry: 0,
      },
    },
  });
}

// 创建全局 QueryClient 实例（用于服务端）
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // 服务端：总是创建新的 QueryClient
    return makeQueryClient();
  } else {
    // 浏览器端：使用单例模式
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// 类型定义
interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'matrix';
  api_provider: 'deepseek' | 'qwen' | 'doubao' | 'openai';
  provider_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UpdateSettingsInput {
  theme?: 'light' | 'dark' | 'matrix';
  api_provider?: 'deepseek' | 'qwen' | 'doubao' | 'openai';
  provider_settings?: Record<string, any>;
}

/**
 * 获取用户配置
 */
export function useUserSettings() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['user-settings', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      return data.settings as UserSettings;
    },
    enabled: !!session?.user?.id,
    // 配置数据应该保持较长时间的新鲜度
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}

/**
 * 更新用户配置
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      return data.settings as UserSettings;
    },
    // 乐观更新
    onMutate: async (newSettings) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({
        queryKey: ['user-settings', session?.user?.id],
      });

      // 获取当前数据
      const previousSettings = queryClient.getQueryData<UserSettings>([
        'user-settings',
        session?.user?.id,
      ]);

      // 乐观更新
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(
          ['user-settings', session?.user?.id],
          {
            ...previousSettings,
            ...newSettings,
            updated_at: new Date().toISOString(),
          }
        );
      }

      return { previousSettings };
    },
    // 如果失败，回滚
    onError: (err, newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          ['user-settings', session?.user?.id],
          context.previousSettings
        );
      }
    },
    // 总是重新获取
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-settings', session?.user?.id],
      });
    },
  });
}

/**
 * 离线缓存和同步逻辑
 * 使用 localStorage 作为离线缓存
 */
export function useOfflineSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();

  // 从 localStorage 加载缓存的设置
  const getCachedSettings = (): UserSettings | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem('user-settings-cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  // 保存设置到 localStorage
  const cacheSettings = (settings: UserSettings) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('user-settings-cache', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to cache settings:', error);
    }
  };

  // 当在线设置更新时，更新缓存
  if (settings && !isLoading) {
    cacheSettings(settings);
  }

  // 同步离线更改
  const syncOfflineChanges = async () => {
    const pendingChanges = localStorage.getItem('pending-settings-changes');
    if (!pendingChanges) return;

    try {
      const changes = JSON.parse(pendingChanges);
      await updateSettings.mutateAsync(changes);
      localStorage.removeItem('pending-settings-changes');
    } catch (error) {
      console.error('Failed to sync offline changes:', error);
    }
  };

  // 更新设置（支持离线）
  const updateWithOfflineSupport = async (input: UpdateSettingsInput) => {
    // 如果在线，直接更新
    if (navigator.onLine) {
      try {
        await updateSettings.mutateAsync(input);
      } catch (error) {
        // 如果失败，保存到待同步队列
        localStorage.setItem('pending-settings-changes', JSON.stringify(input));
        throw error;
      }
    } else {
      // 如果离线，保存到待同步队列
      localStorage.setItem('pending-settings-changes', JSON.stringify(input));
      
      // 更新本地缓存
      const cached = getCachedSettings();
      if (cached) {
        cacheSettings({ ...cached, ...input });
      }
    }
  };

  // 监听在线状态变化，自动同步
  if (typeof window !== 'undefined') {
    window.addEventListener('online', syncOfflineChanges);
  }

  return {
    settings: settings || getCachedSettings(),
    isLoading,
    updateSettings: updateWithOfflineSupport,
    syncOfflineChanges,
  };
}

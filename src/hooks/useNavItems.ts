'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NavItem } from '@/types';

// 获取导航书签列表
export function useNavItems() {
  return useQuery({
    queryKey: ['navItems'],
    queryFn: async () => {
      const response = await fetch('/api/nav');
      if (!response.ok) throw new Error('获取导航列表失败');
      const data = await response.json();
      return data.navItems as NavItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}

// 创建导航书签
export function useCreateNavItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (navItem: Omit<NavItem, 'id'>) => {
      const response = await fetch('/api/nav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(navItem),
      });
      if (!response.ok) throw new Error('创建导航失败');
      const data = await response.json();
      return data.navItem as NavItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navItems'] });
    },
  });
}

// 更新导航书签
export function useUpdateNavItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NavItem> }) => {
      const response = await fetch(`/api/nav/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('更新导航失败');
      const result = await response.json();
      return result.navItem as NavItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navItems'] });
    },
  });
}

// 删除导航书签
export function useDeleteNavItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (navItemId: string) => {
      const response = await fetch(`/api/nav/${navItemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除导航失败');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navItems'] });
    },
  });
}

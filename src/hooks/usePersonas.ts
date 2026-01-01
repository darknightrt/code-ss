'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Persona } from '@/types';

// 获取自定义角色列表
export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await fetch('/api/personas');
      if (!response.ok) throw new Error('获取角色列表失败');
      const data = await response.json();
      return data.personas as Persona[];
    },
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}

// 创建自定义角色
export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (persona: Omit<Persona, 'id' | 'isCustom'>) => {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });
      if (!response.ok) throw new Error('创建角色失败');
      const data = await response.json();
      return data.persona as Persona;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}

// 删除自定义角色
export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personaId: string) => {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除角色失败');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { planRepository } from '@/lib/db/repositories';

// 类型定义
interface LearningPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  category: 'frontend' | 'backend' | 'algorithm' | 'soft-skills';
  progress: number;
  start_date: string;
  end_date: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreatePlanInput {
  title: string;
  description?: string;
  category: 'frontend' | 'backend' | 'algorithm' | 'soft-skills';
  start_date: string;
  end_date: string;
}

interface UpdatePlanInput {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  progress?: number;
  start_date?: string;
  end_date?: string;
}

/**
 * 获取用户的所有学习计划
 */
export function usePlans(includeDeleted = false) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['learning-plans', session?.user?.id, includeDeleted],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await planRepository.getPlansByUser(session.user.id, includeDeleted);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 获取单个学习计划
 */
export function usePlan(planId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['learning-plan', planId],
    queryFn: async () => {
      return await planRepository.getPlanById(planId);
    },
    enabled: !!session?.user?.id && !!planId,
  });
}

/**
 * 创建学习计划
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await planRepository.createPlan(session.user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans'] });
    },
  });
}

/**
 * 更新学习计划
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: UpdatePlanInput }) => {
      return await planRepository.updatePlan(planId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans'] });
      queryClient.invalidateQueries({ queryKey: ['learning-plan', variables.planId] });
    },
  });
}

/**
 * 更新计划进度
 */
export function useUpdatePlanProgress(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: number) => {
      return await planRepository.updateProgress(planId, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans'] });
      queryClient.invalidateQueries({ queryKey: ['learning-plan', planId] });
    },
  });
}

/**
 * 完成学习计划
 */
export function useCompletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      return await planRepository.completePlan(planId);
    },
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans'] });
      queryClient.invalidateQueries({ queryKey: ['learning-plan', planId] });
      // 完成计划会增加用户经验值，所以也要刷新用户统计
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
    },
  });
}

/**
 * 删除学习计划（软删除）
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      return await planRepository.deletePlan(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans'] });
    },
  });
}

/**
 * 恢复已删除的计划
 */
export function useRestorePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      return await planRepository.restorePlan(planId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plans'] });
    },
  });
}

/**
 * 获取计划统计信息
 */
export function usePlanStatistics() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['plan-statistics', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      return await planRepository.getPlanStatistics(session.user.id);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 获取即将到期的计划
 */
export function useUpcomingPlans(days = 7) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['upcoming-plans', session?.user?.id, days],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await planRepository.getUpcomingPlans(session.user.id, days);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 获取逾期的计划
 */
export function useOverduePlans() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['overdue-plans', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await planRepository.getOverduePlans(session.user.id);
    },
    enabled: !!session?.user?.id,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { userRepository, achievementRepository } from '@/lib/db/repositories';

/**
 * 获取用户统计信息
 */
export function useUserStats() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['user-statistics', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      return await userRepository.getUserStatistics(session.user.id);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 获取用户成就
 */
export function useAchievements() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['user-achievements', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await achievementRepository.getAchievementsByUser(session.user.id);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 获取专注趋势
 */
export function useFocusTrends(days = 7) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['focus-trends', session?.user?.id, days],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await achievementRepository.getRecentFocusTrends(session.user.id, days);
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * 增加经验值
 */
export function useAddXp() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (xp: number) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await userRepository.addXp(session.user.id, xp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
    },
  });
}

/**
 * 解锁成就
 */
export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (achievement: {
      achievement_id: string;
      achievement_name: string;
      achievement_icon: string;
    }) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await achievementRepository.unlockAchievement(session.user.id, achievement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });
}

/**
 * 更新专注时长
 */
export function useUpdateFocusHours() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({ date, hours }: { date: string; hours: number }) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      return await achievementRepository.updateFocusHours(session.user.id, date, hours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-trends'] });
    },
  });
}

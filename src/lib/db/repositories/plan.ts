import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type LearningPlan = Database['public']['Tables']['learning_plans']['Row'];
type LearningPlanInsert = Database['public']['Tables']['learning_plans']['Insert'];
type LearningPlanUpdate = Database['public']['Tables']['learning_plans']['Update'];

/**
 * 学习计划数据访问层
 */
export class PlanRepository {
  /**
   * 创建学习计划
   */
  async createPlan(
    userId: string,
    planData: Omit<LearningPlanInsert, 'user_id'>
  ): Promise<LearningPlan> {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .insert({
          user_id: userId,
          ...planData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户的所有计划（不包括已删除）
   */
  async getPlansByUser(
    userId: string,
    options?: {
      includeDeleted?: boolean;
      status?: 'pending' | 'in-progress' | 'completed';
      category?: 'frontend' | 'backend' | 'algorithm' | 'soft-skills';
    }
  ): Promise<LearningPlan[]> {
    try {
      let query = supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', userId);

      // 默认不包括已删除的计划
      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // 按状态筛选
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      // 按分类筛选
      if (options?.category) {
        query = query.eq('category', options.category);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 根据 ID 获取计划
   */
  async getPlanById(planId: string): Promise<LearningPlan | null> {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新计划
   */
  async updatePlan(
    planId: string,
    updates: LearningPlanUpdate
  ): Promise<LearningPlan> {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新计划进度
   */
  async updateProgress(planId: string, progress: number): Promise<LearningPlan> {
    try {
      // 确保进度在 0-100 之间
      const validProgress = Math.max(0, Math.min(100, progress));

      const { data, error } = await supabase
        .from('learning_plans')
        .update({ progress: validProgress })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 完成计划（会触发经验值增加）
   */
  async completePlan(planId: string): Promise<LearningPlan> {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .update({
          status: 'completed',
          progress: 100,
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 软删除计划
   */
  async deletePlan(planId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', planId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 永久删除计划
   */
  async permanentlyDeletePlan(planId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 恢复已删除的计划
   */
  async restorePlan(planId: string): Promise<LearningPlan> {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .update({ deleted_at: null })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取计划统计信息
   */
  async getPlanStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    completionRate: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const plans = await this.getPlansByUser(userId);

      const stats = {
        total: plans.length,
        pending: plans.filter(p => p.status === 'pending').length,
        inProgress: plans.filter(p => p.status === 'in-progress').length,
        completed: plans.filter(p => p.status === 'completed').length,
        completionRate: 0,
        byCategory: {} as Record<string, number>,
      };

      // 计算完成率
      if (stats.total > 0) {
        stats.completionRate = Math.round((stats.completed / stats.total) * 100);
      }

      // 按分类统计
      plans.forEach(plan => {
        stats.byCategory[plan.category] = (stats.byCategory[plan.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取即将到期的计划
   */
  async getUpcomingPlans(
    userId: string,
    daysAhead: number = 7
  ): Promise<LearningPlan[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .neq('status', 'completed')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取过期的计划
   */
  async getOverduePlans(userId: string): Promise<LearningPlan[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .neq('status', 'completed')
        .lt('end_date', today)
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 搜索计划
   */
  async searchPlans(userId: string, query: string): Promise<LearningPlan[]> {
    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

// 导出单例实例
export const planRepository = new PlanRepository();

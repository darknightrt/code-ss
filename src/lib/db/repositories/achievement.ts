import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];
type UserAchievementInsert = Database['public']['Tables']['user_achievements']['Insert'];
type FocusTrend = Database['public']['Tables']['focus_trends']['Row'];
type FocusTrendInsert = Database['public']['Tables']['focus_trends']['Insert'];
type FocusTrendUpdate = Database['public']['Tables']['focus_trends']['Update'];

/**
 * 成就和专注趋势数据访问层
 */
export class AchievementRepository {
  /**
   * 解锁成就
   */
  async unlockAchievement(
    userId: string,
    achievementData: Omit<UserAchievementInsert, 'user_id'>
  ): Promise<UserAchievement> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          ...achievementData,
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
   * 获取用户的所有成就
   */
  async getAchievementsByUser(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 检查成就是否已解锁
   */
  async checkAchievementUnlocked(
    userId: string,
    achievementId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取成就数量
   */
  async getAchievementCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取最近解锁的成就
   */
  async getRecentAchievements(
    userId: string,
    limit: number = 5
  ): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户的专注趋势
   */
  async getFocusTrends(
    userId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<FocusTrend[]> {
    try {
      let query = supabase
        .from('focus_trends')
        .select('*')
        .eq('user_id', userId);

      if (options?.startDate) {
        query = query.gte('date', options.startDate);
      }

      if (options?.endDate) {
        query = query.lte('date', options.endDate);
      }

      query = query.order('date', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取最近 N 天的专注趋势
   */
  async getRecentFocusTrends(
    userId: string,
    days: number = 7
  ): Promise<FocusTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      return this.getFocusTrends(userId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新专注时长
   */
  async updateFocusHours(
    userId: string,
    date: string,
    hours: number
  ): Promise<FocusTrend> {
    try {
      // 先尝试更新
      const { data: existing } = await supabase
        .from('focus_trends')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (existing) {
        // 更新现有记录
        const { data, error } = await supabase
          .from('focus_trends')
          .update({ focus_hours: hours })
          .eq('user_id', userId)
          .eq('date', date)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // 创建新记录
        const dayName = new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
        });

        const { data, error } = await supabase
          .from('focus_trends')
          .insert({
            user_id: userId,
            date,
            day_name: dayName,
            focus_hours: hours,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 增加专注时长
   */
  async addFocusHours(
    userId: string,
    date: string,
    hoursToAdd: number
  ): Promise<FocusTrend> {
    try {
      // 获取当前记录
      const { data: existing } = await supabase
        .from('focus_trends')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      const currentHours = existing?.focus_hours || 0;
      return this.updateFocusHours(userId, date, currentHours + hoursToAdd);
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取总专注时长
   */
  async getTotalFocusHours(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('focus_trends')
        .select('focus_hours')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data.reduce((sum, trend) => sum + trend.focus_hours, 0);
      return Math.round(total * 100) / 100; // 保留两位小数
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取专注趋势统计
   */
  async getFocusStatistics(
    userId: string,
    days: number = 30
  ): Promise<{
    totalHours: number;
    averageHours: number;
    maxHours: number;
    minHours: number;
    trends: FocusTrend[];
  }> {
    try {
      const trends = await this.getRecentFocusTrends(userId, days);

      if (trends.length === 0) {
        return {
          totalHours: 0,
          averageHours: 0,
          maxHours: 0,
          minHours: 0,
          trends: [],
        };
      }

      const hours = trends.map(t => t.focus_hours);
      const totalHours = hours.reduce((sum, h) => sum + h, 0);

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round((totalHours / trends.length) * 100) / 100,
        maxHours: Math.max(...hours),
        minHours: Math.min(...hours),
        trends,
      };
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 创建本周的专注趋势记录
   */
  async createWeeklyFocusTrends(userId: string): Promise<FocusTrend[]> {
    try {
      const trends: FocusTrendInsert[] = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        trends.push({
          user_id: userId,
          date: dateStr,
          day_name: dayName,
          focus_hours: 0,
        });
      }

      const { data, error } = await supabase
        .from('focus_trends')
        .insert(trends)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

// 导出单例实例
export const achievementRepository = new AchievementRepository();

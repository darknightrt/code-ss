import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type User = Database['next_auth']['Tables']['users']['Row'];
type UserUpdate = Database['next_auth']['Tables']['users']['Update'];
type UserSettings = Database['public']['Tables']['user_settings']['Row'];
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

/**
 * 用户数据访问层
 */
export class UserRepository {
  /**
   * 根据 ID 获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(
    id: string,
    updates: Partial<Pick<User, 'name' | 'username' | 'image'>>
  ): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新用户统计数据
   */
  async updateUserStats(
    id: string,
    stats: Partial<Pick<User, 'xp' | 'level' | 'streak_days' | 'completed_tasks' | 'hours_focused'>>
  ): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(stats)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 增加用户经验值
   */
  async addXp(id: string, xpToAdd: number): Promise<User> {
    try {
      // 先获取当前用户数据
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const newXp = user.xp + xpToAdd;
      const newLevel = Math.floor(newXp / 1000) + 1;

      const { data, error } = await supabase
        .from('users')
        .update({
          xp: newXp,
          level: newLevel,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新连续登录天数
   */
  async updateStreakDays(id: string, days: number): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ streak_days: days })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户配置
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新用户配置
   */
  async updateUserSettings(
    userId: string,
    settings: UserSettingsUpdate
  ): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 创建用户配置（通常由触发器自动创建，此方法用于手动创建）
   */
  async createUserSettings(
    userId: string,
    settings?: Partial<UserSettings>
  ): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...settings,
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
   * 获取用户排行榜（按经验值排序）
   */
  async getLeaderboard(limit: number = 100): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, level, xp, image')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStatistics(userId: string): Promise<UserStatistics> {
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
      throw error; // 确保类型检查通过
    }
  }
}

// 导出单例实例
export const userRepository = new UserRepository();

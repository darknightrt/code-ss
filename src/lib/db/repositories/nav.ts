import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type NavItem = Database['public']['Tables']['nav_items']['Row'];
type NavItemInsert = Database['public']['Tables']['nav_items']['Insert'];
type NavItemUpdate = Database['public']['Tables']['nav_items']['Update'];

/**
 * 导航书签数据访问层
 */
export class NavRepository {
  /**
   * 创建导航项
   */
  async createNavItem(
    userId: string,
    navData: Omit<NavItemInsert, 'user_id'>
  ): Promise<NavItem> {
    try {
      const { data, error } = await supabase
        .from('nav_items')
        .insert({
          user_id: userId,
          ...navData,
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
   * 获取用户的所有导航项
   */
  async getNavItemsByUser(
    userId: string,
    options?: {
      category?: string;
    }
  ): Promise<NavItem[]> {
    try {
      let query = supabase
        .from('nav_items')
        .select('*')
        .eq('user_id', userId);

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
   * 根据 ID 获取导航项
   */
  async getNavItemById(navItemId: string): Promise<NavItem | null> {
    try {
      const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .eq('id', navItemId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新导航项
   */
  async updateNavItem(
    navItemId: string,
    updates: NavItemUpdate
  ): Promise<NavItem> {
    try {
      const { data, error } = await supabase
        .from('nav_items')
        .update(updates)
        .eq('id', navItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 删除导航项
   */
  async deleteNavItem(navItemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('nav_items')
        .delete()
        .eq('id', navItemId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 按分类筛选导航项
   */
  async filterByCategory(userId: string, category: string): Promise<NavItem[]> {
    return this.getNavItemsByUser(userId, { category });
  }

  /**
   * 获取所有分类
   */
  async getCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('nav_items')
        .select('category')
        .eq('user_id', userId);

      if (error) throw error;

      // 去重
      const categories = [...new Set(data.map(item => item.category))];
      return categories;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 搜索导航项
   */
  async searchNavItems(userId: string, query: string): Promise<NavItem[]> {
    try {
      const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 批量创建导航项
   */
  async batchCreateNavItems(
    userId: string,
    navItems: Array<Omit<NavItemInsert, 'user_id'>>
  ): Promise<NavItem[]> {
    try {
      const { data, error } = await supabase
        .from('nav_items')
        .insert(
          navItems.map(item => ({
            user_id: userId,
            ...item,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取导航项数量
   */
  async getNavItemCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('nav_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 按分类统计导航项
   */
  async getStatisticsByCategory(
    userId: string
  ): Promise<Record<string, number>> {
    try {
      const items = await this.getNavItemsByUser(userId);

      const stats: Record<string, number> = {};
      items.forEach(item => {
        stats[item.category] = (stats[item.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 导出导航项为 JSON
   */
  async exportNavItems(userId: string): Promise<string> {
    try {
      const items = await this.getNavItemsByUser(userId);

      // 移除不需要导出的字段
      const exportData = items.map(({ id, user_id, created_at, updated_at, ...item }) => item);

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 从 JSON 导入导航项
   */
  async importNavItems(userId: string, jsonData: string): Promise<NavItem[]> {
    try {
      const items = JSON.parse(jsonData);

      if (!Array.isArray(items)) {
        throw new Error('Invalid JSON format: expected an array');
      }

      // 验证必需字段
      const requiredFields = ['title', 'url', 'category'];
      for (const item of items) {
        for (const field of requiredFields) {
          if (!item[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      }

      return await this.batchCreateNavItems(userId, items);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      handleSupabaseError(error);
    }
  }
}

// 导出单例实例
export const navRepository = new NavRepository();

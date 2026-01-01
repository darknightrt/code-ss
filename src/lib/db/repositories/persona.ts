import { supabase } from '../client';
import { handleSupabaseError } from '../errors';
import type { Database } from '../types';

type CustomPersona = Database['public']['Tables']['custom_personas']['Row'];
type CustomPersonaInsert = Database['public']['Tables']['custom_personas']['Insert'];
type CustomPersonaUpdate = Database['public']['Tables']['custom_personas']['Update'];

/**
 * 自定义角色数据访问层
 */
export class PersonaRepository {
  /**
   * 创建自定义角色
   */
  async createPersona(
    userId: string,
    personaData: Omit<CustomPersonaInsert, 'user_id'>
  ): Promise<CustomPersona> {
    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .insert({
          user_id: userId,
          ...personaData,
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
   * 获取用户的所有自定义角色
   */
  async getPersonasByUser(userId: string): Promise<CustomPersona[]> {
    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 根据 ID 获取角色
   */
  async getPersonaById(personaId: string): Promise<CustomPersona | null> {
    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 更新角色
   */
  async updatePersona(
    personaId: string,
    updates: CustomPersonaUpdate
  ): Promise<CustomPersona> {
    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .update(updates)
        .eq('id', personaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 删除角色
   */
  async deletePersona(personaId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('custom_personas')
        .delete()
        .eq('id', personaId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 检查角色是否被会话使用
   */
  async checkPersonaUsage(personaId: string): Promise<{
    isUsed: boolean;
    sessionCount: number;
    sessions?: Array<{ id: string; title: string }>;
  }> {
    try {
      const { data, error, count } = await supabase
        .from('chat_sessions')
        .select('id, title', { count: 'exact' })
        .eq('persona_id', personaId);

      if (error) throw error;

      return {
        isUsed: (count || 0) > 0,
        sessionCount: count || 0,
        sessions: data || [],
      };
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 导出角色配置为 JSON
   */
  async exportPersona(personaId: string): Promise<string> {
    try {
      const persona = await this.getPersonaById(personaId);
      if (!persona) {
        throw new Error('Persona not found');
      }

      // 移除不需要导出的字段
      const { id, user_id, created_at, updated_at, ...exportData } = persona;

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 从 JSON 导入角色配置
   */
  async importPersona(
    userId: string,
    jsonData: string
  ): Promise<CustomPersona> {
    try {
      const personaData = JSON.parse(jsonData);

      // 验证必需字段
      const requiredFields = ['name', 'role', 'avatar', 'description', 'system_prompt'];
      for (const field of requiredFields) {
        if (!personaData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return await this.createPersona(userId, personaData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      handleSupabaseError(error);
    }
  }

  /**
   * 复制角色
   */
  async duplicatePersona(
    personaId: string,
    userId: string
  ): Promise<CustomPersona> {
    try {
      const original = await this.getPersonaById(personaId);
      if (!original) {
        throw new Error('Persona not found');
      }

      const { id, user_id, created_at, updated_at, ...personaData } = original;

      return await this.createPersona(userId, {
        ...personaData,
        name: `${personaData.name} (副本)`,
      });
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 搜索角色
   */
  async searchPersonas(
    userId: string,
    query: string
  ): Promise<CustomPersona[]> {
    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,role.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * 获取角色数量
   */
  async getPersonaCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('custom_personas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

// 导出单例实例
export const personaRepository = new PersonaRepository();
